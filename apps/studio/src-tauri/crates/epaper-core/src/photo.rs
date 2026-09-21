//! Fitting arbitrary photos to the panel resolution.
//!
//! Replaces `scripts/convert-images-with-crop.sh` (ImageMagick `-resize` plus
//! a centred `-crop`) and the scale/cut branches of `scripts/convert.py`.

use image::imageops::FilterType;
use image::{Rgb, RgbImage};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Fit {
    /// Fill the page and crop what sticks out. The original shell script's
    /// `-resize <w>x` followed by a centred crop.
    Cover,
    /// Fit the whole photo on the page and pad the rest with white.
    Contain,
}

#[derive(Clone, Copy, Debug)]
pub struct FitOptions {
    pub width: u32,
    pub height: u32,
    pub fit: Fit,
    /// Rotate a portrait photo onto a landscape page (and vice versa) instead
    /// of cropping most of it away.
    pub auto_rotate: bool,
}

pub fn fit(source: &RgbImage, options: FitOptions) -> RgbImage {
    let target_width = options.width.max(1);
    let target_height = options.height.max(1);

    let source = if options.auto_rotate && orientation_differs(source, target_width, target_height) {
        image::imageops::rotate90(source)
    } else {
        source.clone()
    };

    let scale = {
        let horizontal = target_width as f64 / source.width() as f64;
        let vertical = target_height as f64 / source.height() as f64;
        match options.fit {
            Fit::Cover => horizontal.max(vertical),
            Fit::Contain => horizontal.min(vertical),
        }
    };

    let scaled_width = ((source.width() as f64 * scale).round() as u32).max(1);
    let scaled_height = ((source.height() as f64 * scale).round() as u32).max(1);
    let scaled = image::imageops::resize(&source, scaled_width, scaled_height, FilterType::Lanczos3);

    // Centre the scaled image on a white page; Cover overflows and is cropped,
    // Contain falls short and leaves white margins.
    let mut page = RgbImage::from_pixel(target_width, target_height, Rgb([255, 255, 255]));
    let left = (target_width as i64 - scaled_width as i64) / 2;
    let top = (target_height as i64 - scaled_height as i64) / 2;
    image::imageops::overlay(&mut page, &scaled, left, top);
    page
}

fn orientation_differs(source: &RgbImage, target_width: u32, target_height: u32) -> bool {
    let source_is_landscape = source.width() >= source.height();
    let target_is_landscape = target_width >= target_height;
    source_is_landscape != target_is_landscape
}

#[cfg(test)]
mod tests {
    use super::*;

    fn options(fit: Fit) -> FitOptions {
        FitOptions { width: 480, height: 800, fit, auto_rotate: false }
    }

    #[test]
    fn output_always_has_the_page_size() {
        for source in [RgbImage::new(4000, 3000), RgbImage::new(100, 900), RgbImage::new(480, 800)] {
            for mode in [Fit::Cover, Fit::Contain] {
                let fitted = fit(&source, options(mode));
                assert_eq!((fitted.width(), fitted.height()), (480, 800));
            }
        }
    }

    #[test]
    fn contain_leaves_white_margins_where_cover_does_not() {
        // A wide photo on a portrait page: Contain pads top and bottom.
        let source = RgbImage::from_pixel(1000, 200, Rgb([0, 0, 0]));
        let contained = fit(&source, options(Fit::Contain));
        assert_eq!(*contained.get_pixel(240, 0), Rgb([255, 255, 255]));
        assert_eq!(*contained.get_pixel(240, 400), Rgb([0, 0, 0]));

        let covered = fit(&source, options(Fit::Cover));
        assert!(covered.pixels().all(|pixel| *pixel == Rgb([0, 0, 0])));
    }

    #[test]
    fn auto_rotate_turns_a_landscape_photo_onto_a_portrait_page() {
        let source = RgbImage::from_pixel(800, 400, Rgb([0, 0, 0]));
        let rotated = fit(
            &source,
            FitOptions { width: 480, height: 800, fit: Fit::Contain, auto_rotate: true },
        );
        // Rotated to 400x800 it already matches the page height, so it sits
        // centred with 40 px of white down each side instead of being cropped
        // to a narrow strip.
        assert_eq!(*rotated.get_pixel(0, 400), Rgb([255, 255, 255]));
        assert_eq!(*rotated.get_pixel(240, 400), Rgb([0, 0, 0]));
        assert_eq!(*rotated.get_pixel(479, 400), Rgb([255, 255, 255]));
    }
}
