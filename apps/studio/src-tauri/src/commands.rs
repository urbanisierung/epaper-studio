//! The commands the UI calls. Thin wrappers: everything interesting lives in
//! `epaper-core`, everything visual lives in the webview.

use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use epaper_core::{filelist, photo, ConvertOptions};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

const PROJECT_FILE: &str = "project.json";

/// Serde-friendly mirror of [`ConvertOptions`], as the UI sends it.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageOptions {
    pub width: u32,
    pub height: u32,
    /// "cover" or "contain".
    pub fit: String,
    pub auto_rotate: bool,
    pub dither: bool,
}

impl From<&ImageOptions> for ConvertOptions {
    fn from(options: &ImageOptions) -> Self {
        ConvertOptions {
            width: options.width,
            height: options.height,
            fit: if options.fit == "contain" {
                photo::Fit::Contain
            } else {
                photo::Fit::Cover
            },
            auto_rotate: options.auto_rotate,
            dither: options.dither,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreparedOutput {
    /// Absolute path of the `pic` directory that was created.
    pub picture_dir: String,
    /// Files that were cleared out, for the export log.
    pub removed: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FirmwareImage {
    pub file_name: String,
    pub interval_hours: u32,
}

/// Create `<root>/pic`, and optionally clear a previous run out of the way.
///
/// The device keeps its own bookkeeping next to `fileList.txt`, and stale
/// entries make it show the wrong pictures — the original README's "delete
/// index and filelist files" step. Anything removed is reported back so the
/// UI can show exactly what happened to the card.
#[tauri::command]
pub fn prepare_output(root: String, clear: bool) -> Result<PreparedOutput, String> {
    let root = PathBuf::from(root);
    let picture_dir = root.join(filelist::PICTURE_DIR);
    let mut removed = Vec::new();

    if clear {
        if picture_dir.is_dir() {
            for entry in fs::read_dir(&picture_dir).map_err(stringify)? {
                let path = entry.map_err(stringify)?.path();
                if path.is_file() {
                    fs::remove_file(&path).map_err(stringify)?;
                    removed.push(display(&path));
                }
            }
        }
        if root.is_dir() {
            for entry in fs::read_dir(&root).map_err(stringify)? {
                let path = entry.map_err(stringify)?.path();
                if !path.is_file() {
                    continue;
                }
                let name = path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or_default()
                    .to_ascii_lowercase();
                if name == filelist::FILE_LIST_NAME.to_ascii_lowercase() || name.starts_with("index")
                {
                    fs::remove_file(&path).map_err(stringify)?;
                    removed.push(display(&path));
                }
            }
        }
    }

    fs::create_dir_all(&picture_dir).map_err(stringify)?;
    Ok(PreparedOutput { picture_dir: display(&picture_dir), removed })
}

/// Write one page the webview rendered. The canvas arrives as a base64 PNG —
/// a calendar page is mostly flat white and compresses to a few kilobytes,
/// which is far cheaper than shipping raw RGBA across the IPC boundary.
#[tauri::command]
pub fn save_page(
    root: String,
    file_name: String,
    png_base64: String,
    options: ImageOptions,
) -> Result<(), String> {
    let bytes = BASE64
        .decode(strip_data_url(&png_base64))
        .map_err(|error| format!("could not decode the rendered page: {error}"))?;
    let bmp = epaper_core::convert_bytes(&bytes, (&options).into()).map_err(stringify)?;
    write_picture(&root, &file_name, &bmp)
}

/// Read a photo off disk, fit it to the panel and dither it. The image never
/// crosses the IPC boundary.
#[tauri::command]
pub fn save_photo(
    root: String,
    file_name: String,
    source_path: String,
    options: ImageOptions,
) -> Result<(), String> {
    let bmp = epaper_core::convert_file(Path::new(&source_path), (&options).into())
        .map_err(|error| format!("{source_path}: {error}"))?;
    write_picture(&root, &file_name, &bmp)
}

/// What the panel will make of a photo, as a data URL for the preview pane.
#[tauri::command]
pub fn preview_photo(source_path: String, options: ImageOptions) -> Result<String, String> {
    let source = image::open(&source_path)
        .map_err(|error| format!("{source_path}: {error}"))?
        .to_rgb8();
    let png = epaper_core::preview_png(&source, (&options).into()).map_err(stringify)?;
    Ok(format!("data:image/png;base64,{}", BASE64.encode(png)))
}

/// Write the playlist the device reads at the SD card root.
#[tauri::command]
pub fn write_file_list(root: String, file_names: Vec<String>) -> Result<String, String> {
    let path = PathBuf::from(root).join(filelist::FILE_LIST_NAME);
    fs::write(&path, filelist::render(&file_names)).map_err(stringify)?;
    Ok(display(&path))
}

/// The RTC firmware images bundled with the app, newest interval first.
#[tauri::command]
pub fn list_firmware(app: tauri::AppHandle) -> Result<Vec<FirmwareImage>, String> {
    let dir = firmware_dir(&app)?;
    let mut images = Vec::new();
    for entry in fs::read_dir(&dir).map_err(stringify)? {
        let path = entry.map_err(stringify)?.path();
        let Some(name) = path.file_name().and_then(|name| name.to_str()) else {
            continue;
        };
        if !name.ends_with(".uf2") {
            continue;
        }
        let interval_hours = name
            .trim_start_matches("rtc_")
            .split('_')
            .next()
            .and_then(|hours| hours.parse().ok())
            .unwrap_or(0);
        images.push(FirmwareImage { file_name: name.to_string(), interval_hours });
    }
    images.sort_by_key(|image| image.interval_hours);
    Ok(images)
}

/// Copy one firmware image onto the mounted `RPI-RP2` drive.
#[tauri::command]
pub fn copy_firmware(
    app: tauri::AppHandle,
    file_name: String,
    target_dir: String,
) -> Result<String, String> {
    if file_name.contains(['/', '\\']) || !file_name.ends_with(".uf2") {
        return Err(format!("{file_name} is not a firmware image"));
    }
    let source = firmware_dir(&app)?.join(&file_name);
    let target = PathBuf::from(target_dir).join(&file_name);
    fs::copy(&source, &target).map_err(stringify)?;
    Ok(display(&target))
}

/// The autosaved project, if there is one.
#[tauri::command]
pub fn load_project(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = project_path(&app)?;
    if !path.is_file() {
        return Ok(None);
    }
    fs::read_to_string(&path).map(Some).map_err(stringify)
}

#[tauri::command]
pub fn save_project(app: tauri::AppHandle, contents: String) -> Result<String, String> {
    let path = project_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(stringify)?;
    }
    fs::write(&path, contents).map_err(stringify)?;
    Ok(display(&path))
}

/// Read a project file the user picked, or write one they chose to export.
#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|error| format!("{path}: {error}"))
}

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|error| format!("{path}: {error}"))
}

fn write_picture(root: &str, file_name: &str, bmp: &[u8]) -> Result<(), String> {
    if file_name.contains(['/', '\\']) {
        return Err(format!("{file_name} is not a plain file name"));
    }
    let dir = PathBuf::from(root).join(filelist::PICTURE_DIR);
    fs::create_dir_all(&dir).map_err(stringify)?;
    fs::write(dir.join(file_name), bmp).map_err(stringify)
}

fn firmware_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .resolve("resources/firmware", tauri::path::BaseDirectory::Resource)
        .map_err(|error| format!("bundled firmware is missing: {error}"))
}

fn project_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|dir| dir.join(PROJECT_FILE))
        .map_err(stringify)
}

fn strip_data_url(value: &str) -> &str {
    value.rsplit_once("base64,").map_or(value, |(_, data)| data)
}

fn display(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn stringify(error: impl std::fmt::Display) -> String {
    error.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::RgbImage;

    #[test]
    fn data_urls_and_bare_base64_both_decode() {
        assert_eq!(strip_data_url("data:image/png;base64,AAAA"), "AAAA");
        assert_eq!(strip_data_url("AAAA"), "AAAA");
    }

    #[test]
    fn a_run_leaves_the_card_in_the_layout_the_display_expects() {
        let root = temp_dir("epaper-studio-write");
        let options = || ImageOptions {
            width: 8,
            height: 4,
            fit: "cover".into(),
            auto_rotate: false,
            dither: false,
        };

        let prepared = prepare_output(display(&root), true).unwrap();
        assert!(Path::new(&prepared.picture_dir).is_dir());

        let page = page_png(8, 4);
        save_page(display(&root), "20260716.bmp".into(), page.clone(), options()).unwrap();
        save_page(display(&root), "20260717.bmp".into(), page, options()).unwrap();
        let list = write_file_list(
            display(&root),
            vec!["20260716.bmp".into(), "20260717.bmp".into()],
        )
        .unwrap();

        assert!(root.join("pic/20260716.bmp").is_file());
        assert!(root.join("pic/20260717.bmp").is_file());
        assert_eq!(
            fs::read_to_string(&list).unwrap(),
            "pic/20260716.bmp\npic/20260717.bmp"
        );
        // The pictures really are BMPs of the right size.
        let written = image::open(root.join("pic/20260716.bmp")).unwrap();
        assert_eq!((written.width(), written.height()), (8, 4));

        fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn clearing_removes_the_last_run_and_the_displays_own_bookkeeping() {
        let root = temp_dir("epaper-studio-clear");
        fs::create_dir_all(root.join("pic")).unwrap();
        fs::write(root.join("pic/old.bmp"), b"stale").unwrap();
        fs::write(root.join("fileList.txt"), b"pic/old.bmp").unwrap();
        fs::write(root.join("index.dat"), b"7").unwrap();
        fs::write(root.join("keep.txt"), b"mine").unwrap();

        let prepared = prepare_output(display(&root), true).unwrap();

        assert_eq!(prepared.removed.len(), 3);
        assert!(!root.join("pic/old.bmp").exists());
        assert!(!root.join("fileList.txt").exists());
        assert!(!root.join("index.dat").exists());
        // Anything the display does not own is left alone.
        assert!(root.join("keep.txt").exists());

        fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn a_file_name_cannot_escape_the_picture_directory() {
        let root = temp_dir("epaper-studio-escape");
        let error = write_picture(&display(&root), "../escaped.bmp", b"x").unwrap_err();
        assert!(error.contains("plain file name"));
        fs::remove_dir_all(&root).ok();
    }

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("{name}-{}", std::process::id()));
        fs::remove_dir_all(&dir).ok();
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn page_png(width: u32, height: u32) -> String {
        let image = RgbImage::from_pixel(width, height, image::Rgb([255, 255, 255]));
        let mut buffer = std::io::Cursor::new(Vec::new());
        image.write_to(&mut buffer, image::ImageFormat::Png).unwrap();
        format!("data:image/png;base64,{}", BASE64.encode(buffer.into_inner()))
    }
}
