//! The image pipeline for Waveshare PhotoPainter e-paper displays.
//!
//! Everything the original project shelled out to ImageMagick and Python for,
//! in one crate with no external binaries. Kept free of any Tauri dependency
//! so it builds and tests without a webview toolchain.

pub mod bmp;
pub mod dither;
pub mod filelist;
pub mod palette;
pub mod photo;

use image::RgbImage;
use std::io;
use std::path::Path;

#[derive(Debug)]
pub enum Error {
    Image(image::ImageError),
    Io(io::Error),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::Image(error) => write!(f, "{error}"),
            Error::Io(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for Error {}

impl From<image::ImageError> for Error {
    fn from(error: image::ImageError) -> Self {
        Error::Image(error)
    }
}

impl From<io::Error> for Error {
    fn from(error: io::Error) -> Self {
        Error::Io(error)
    }
}

pub type Result<T> = std::result::Result<T, Error>;

/// How a source image becomes a picture on the SD card.
#[derive(Clone, Copy, Debug)]
pub struct ConvertOptions {
    pub width: u32,
    pub height: u32,
    pub fit: photo::Fit,
    pub auto_rotate: bool,
    /// Off for calendar pages, which are already drawn in palette colours;
    /// on for photographs.
    pub dither: bool,
}

/// Fit an image to the page and reduce it to the panel's palette.
pub fn prepare(source: &RgbImage, options: ConvertOptions) -> RgbImage {
    let fitted = photo::fit(
        source,
        photo::FitOptions {
            width: options.width,
            height: options.height,
            fit: options.fit,
            auto_rotate: options.auto_rotate,
        },
    );
    if options.dither {
        dither::floyd_steinberg(&fitted)
    } else {
        fitted
    }
}

/// Decode any supported image, prepare it, and return it as a 24-bit BMP.
pub fn convert_bytes(bytes: &[u8], options: ConvertOptions) -> Result<Vec<u8>> {
    let source = image::load_from_memory(bytes)?.to_rgb8();
    Ok(bmp::encode(&prepare(&source, options)))
}

/// Same as [`convert_bytes`], reading from disk.
pub fn convert_file(path: &Path, options: ConvertOptions) -> Result<Vec<u8>> {
    let source = image::open(path)?.to_rgb8();
    Ok(bmp::encode(&prepare(&source, options)))
}

/// A PNG preview of what the panel will show, for the UI.
pub fn preview_png(source: &RgbImage, options: ConvertOptions) -> Result<Vec<u8>> {
    let prepared = prepare(source, options);
    let mut out = io::Cursor::new(Vec::new());
    prepared.write_to(&mut out, image::ImageFormat::Png)?;
    Ok(out.into_inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::Rgb;

    fn options(dither: bool) -> ConvertOptions {
        ConvertOptions {
            width: 480,
            height: 800,
            fit: photo::Fit::Cover,
            auto_rotate: false,
            dither,
        }
    }

    fn png_of(image: &RgbImage) -> Vec<u8> {
        let mut out = io::Cursor::new(Vec::new());
        image.write_to(&mut out, image::ImageFormat::Png).unwrap();
        out.into_inner()
    }

    #[test]
    fn a_png_page_becomes_a_readable_bmp_of_the_right_size() {
        let page = RgbImage::from_pixel(480, 800, Rgb([255, 255, 255]));
        let bmp = convert_bytes(&png_of(&page), options(false)).unwrap();

        assert_eq!(&bmp[0..2], b"BM");
        let decoded = image::load_from_memory_with_format(&bmp, image::ImageFormat::Bmp)
            .unwrap()
            .to_rgb8();
        assert_eq!((decoded.width(), decoded.height()), (480, 800));
        assert_eq!(decoded, page);
    }

    #[test]
    fn a_photo_is_reduced_to_palette_colours() {
        let mut photo = RgbImage::new(120, 90);
        for (x, y, pixel) in photo.enumerate_pixels_mut() {
            *pixel = Rgb([(x * 2) as u8, (y * 2) as u8, 90]);
        }
        let bmp = convert_bytes(&png_of(&photo), options(true)).unwrap();
        let decoded = image::load_from_memory_with_format(&bmp, image::ImageFormat::Bmp)
            .unwrap()
            .to_rgb8();
        assert_eq!((decoded.width(), decoded.height()), (480, 800));
        assert!(decoded
            .pixels()
            .all(|pixel| palette::PALETTE.contains(&[pixel[0], pixel[1], pixel[2]])));
    }

    #[test]
    fn preview_round_trips_as_png() {
        let source = RgbImage::from_pixel(60, 60, Rgb([200, 30, 30]));
        let png = preview_png(&source, options(true)).unwrap();
        let decoded = image::load_from_memory_with_format(&png, image::ImageFormat::Png).unwrap();
        assert_eq!((decoded.width(), decoded.height()), (480, 800));
    }
}
