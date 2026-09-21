//! `fileList.txt` — the playlist the PhotoPainter reads from the SD card root.
//!
//! One `pic/<name>.bmp` line per picture, in display order. The original
//! script built this by stripping the output base path off each written file.

pub const FILE_LIST_NAME: &str = "fileList.txt";
pub const PICTURE_DIR: &str = "pic";

/// The device is documented to hold 100 pictures; more than that is worth a
/// warning in the UI.
pub const RECOMMENDED_MAX_PICTURES: usize = 100;

pub fn render(filenames: &[String]) -> String {
    filenames
        .iter()
        .map(|name| format!("{PICTURE_DIR}/{name}"))
        .collect::<Vec<_>>()
        .join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lines_are_prefixed_with_the_picture_directory() {
        let list = render(&["20260716.bmp".into(), "20260717.bmp".into()]);
        assert_eq!(list, "pic/20260716.bmp\npic/20260717.bmp");
    }

    #[test]
    fn an_empty_selection_renders_an_empty_file() {
        assert_eq!(render(&[]), "");
    }
}
