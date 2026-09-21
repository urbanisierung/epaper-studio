//! Floyd–Steinberg dithering against the panel's 7-colour palette.
//!
//! Replaces the Pillow `quantize(dither=FLOYDSTEINBERG, palette=...)` call in
//! the original `scripts/convert.py`.

use crate::palette;
use image::{Rgb, RgbImage};

/// Quantise every pixel to its nearest palette colour, spreading the error to
/// neighbours that have not been visited yet (7/16 right, 3/16 below-left,
/// 5/16 below, 1/16 below-right).
pub fn floyd_steinberg(image: &RgbImage) -> RgbImage {
    let width = image.width() as i64;
    let height = image.height() as i64;

    // Error accumulates well outside 0..255, so carry the working image in f32.
    let mut working: Vec<[f32; 3]> = image
        .pixels()
        .map(|pixel| [pixel[0] as f32, pixel[1] as f32, pixel[2] as f32])
        .collect();

    let mut out = RgbImage::new(image.width(), image.height());

    for y in 0..height {
        for x in 0..width {
            let index = (y * width + x) as usize;
            let old = working[index];
            let quantized = palette::nearest([
                clamp_to_u8(old[0]),
                clamp_to_u8(old[1]),
                clamp_to_u8(old[2]),
            ]);
            out.put_pixel(x as u32, y as u32, Rgb(quantized));

            let error = [
                old[0] - quantized[0] as f32,
                old[1] - quantized[1] as f32,
                old[2] - quantized[2] as f32,
            ];

            for (dx, dy, weight) in [
                (1i64, 0i64, 7.0 / 16.0),
                (-1, 1, 3.0 / 16.0),
                (0, 1, 5.0 / 16.0),
                (1, 1, 1.0 / 16.0),
            ] {
                let nx = x + dx;
                let ny = y + dy;
                if nx < 0 || nx >= width || ny >= height {
                    continue;
                }
                let neighbour = &mut working[(ny * width + nx) as usize];
                for channel in 0..3 {
                    neighbour[channel] += error[channel] * weight;
                }
            }
        }
    }

    out
}

/// Nearest palette colour per pixel, no error diffusion. Used for previewing
/// artwork that is already drawn in palette colours.
pub fn nearest_only(image: &RgbImage) -> RgbImage {
    let mut out = RgbImage::new(image.width(), image.height());
    for (x, y, pixel) in image.enumerate_pixels() {
        out.put_pixel(x, y, Rgb(palette::nearest([pixel[0], pixel[1], pixel[2]])));
    }
    out
}

fn clamp_to_u8(value: f32) -> u8 {
    value.round().clamp(0.0, 255.0) as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    fn is_in_palette(pixel: &Rgb<u8>) -> bool {
        palette::PALETTE.contains(&[pixel[0], pixel[1], pixel[2]])
    }

    #[test]
    fn every_output_pixel_is_a_palette_colour() {
        let mut image = RgbImage::new(32, 32);
        for (x, y, pixel) in image.enumerate_pixels_mut() {
            *pixel = Rgb([(x * 8) as u8, (y * 8) as u8, ((x + y) * 4) as u8]);
        }
        let dithered = floyd_steinberg(&image);
        assert!(dithered.pixels().all(is_in_palette));
        assert!(nearest_only(&image).pixels().all(is_in_palette));
    }

    #[test]
    fn images_already_in_palette_are_left_alone() {
        // Calendar pages are drawn in pure black, white and red, so dithering
        // them must be a no-op rather than a source of speckle.
        let mut image = RgbImage::new(16, 16);
        for (x, _y, pixel) in image.enumerate_pixels_mut() {
            *pixel = Rgb(match x % 3 {
                0 => palette::BLACK,
                1 => palette::WHITE,
                _ => palette::RED,
            });
        }
        assert_eq!(floyd_steinberg(&image), image);
    }

    #[test]
    fn mid_grey_dithers_to_a_mix_that_averages_back_to_mid_grey() {
        // The panel has no grey, so error diffusion has to fake it by mixing
        // palette colours. What matters is that the average comes back.
        let image = RgbImage::from_pixel(64, 64, Rgb([128, 128, 128]));
        let dithered = floyd_steinberg(&image);

        let distinct: std::collections::HashSet<[u8; 3]> =
            dithered.pixels().map(|pixel| pixel.0).collect();
        assert!(distinct.len() > 1, "a flat grey should not map to a single colour");

        let pixel_count = dithered.pixels().len() as f64;
        for channel in 0..3 {
            let mean = dithered
                .pixels()
                .map(|pixel| pixel[channel] as f64)
                .sum::<f64>()
                / pixel_count;
            assert!(
                (mean - 128.0).abs() < 12.0,
                "channel {channel} averaged {mean}, expected roughly 128"
            );
        }
    }
}
