//! 24-bit BMP writer.
//!
//! Replaces `convert <png> -type truecolor <bmp>`, byte for byte: a 14-byte
//! file header, a 124-byte `BITMAPV5HEADER`, then bottom-up BGR rows padded to
//! a multiple of four bytes. ImageMagick writes the V5 form, and that is the
//! form the display has been fed all along, so this emits the same — the
//! fixtures in `tests/` pin it against real `convert` output.

use image::RgbImage;

const FILE_HEADER_SIZE: u32 = 14;
/// `BITMAPV5HEADER`. ImageMagick uses it rather than the classic 40-byte one.
const INFO_HEADER_SIZE: u32 = 124;
const PIXEL_DATA_OFFSET: u32 = FILE_HEADER_SIZE + INFO_HEADER_SIZE;
const LCS_SRGB: u32 = 0x7352_4742; // 'sRGB'
const LCS_GM_IMAGES: u32 = 4; // rendering intent

pub fn encode(image: &RgbImage) -> Vec<u8> {
    let width = image.width();
    let height = image.height();
    let row_padding = (4 - (width as usize * 3) % 4) % 4;
    let row_size = width as usize * 3 + row_padding;
    let pixel_data_size = row_size * height as usize;

    let mut out = Vec::with_capacity(PIXEL_DATA_OFFSET as usize + pixel_data_size);

    // BITMAPFILEHEADER
    out.extend_from_slice(b"BM");
    out.extend_from_slice(&(PIXEL_DATA_OFFSET + pixel_data_size as u32).to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes()); // reserved
    out.extend_from_slice(&0u16.to_le_bytes()); // reserved
    out.extend_from_slice(&PIXEL_DATA_OFFSET.to_le_bytes());

    // BITMAPV5HEADER
    out.extend_from_slice(&INFO_HEADER_SIZE.to_le_bytes());
    out.extend_from_slice(&(width as i32).to_le_bytes());
    out.extend_from_slice(&(height as i32).to_le_bytes()); // positive: bottom-up
    out.extend_from_slice(&1u16.to_le_bytes()); // colour planes
    out.extend_from_slice(&24u16.to_le_bytes()); // bits per pixel
    out.extend_from_slice(&0u32.to_le_bytes()); // BI_RGB, no compression
    out.extend_from_slice(&(pixel_data_size as u32).to_le_bytes());
    out.extend_from_slice(&0u32.to_le_bytes()); // horizontal pixels per metre
    out.extend_from_slice(&0u32.to_le_bytes()); // vertical pixels per metre
    out.extend_from_slice(&0u32.to_le_bytes()); // palette entries used
    out.extend_from_slice(&0u32.to_le_bytes()); // important palette entries
    out.extend_from_slice(&0x00ff_0000u32.to_le_bytes()); // red mask
    out.extend_from_slice(&0x0000_ff00u32.to_le_bytes()); // green mask
    out.extend_from_slice(&0x0000_00ffu32.to_le_bytes()); // blue mask
    out.extend_from_slice(&0xff00_0000u32.to_le_bytes()); // alpha mask
    out.extend_from_slice(&LCS_SRGB.to_le_bytes());
    out.extend_from_slice(&[0u8; 36]); // CIEXYZTRIPLE endpoints, unused for sRGB
    out.extend_from_slice(&0u32.to_le_bytes()); // gamma red
    out.extend_from_slice(&0u32.to_le_bytes()); // gamma green
    out.extend_from_slice(&0u32.to_le_bytes()); // gamma blue
    out.extend_from_slice(&LCS_GM_IMAGES.to_le_bytes());
    out.extend_from_slice(&0u32.to_le_bytes()); // profile offset
    out.extend_from_slice(&0u32.to_le_bytes()); // profile size
    out.extend_from_slice(&0u32.to_le_bytes()); // reserved

    debug_assert_eq!(out.len(), PIXEL_DATA_OFFSET as usize);

    let padding = vec![0u8; row_padding];
    for y in (0..height).rev() {
        for x in 0..width {
            let pixel = image.get_pixel(x, y);
            out.push(pixel[2]);
            out.push(pixel[1]);
            out.push(pixel[0]);
        }
        out.extend_from_slice(&padding);
    }

    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::Rgb;

    const HEAD: usize = PIXEL_DATA_OFFSET as usize;

    #[test]
    fn header_describes_the_image() {
        let bmp = encode(&RgbImage::new(480, 800));
        assert_eq!(&bmp[0..2], b"BM");
        assert_eq!(u32::from_le_bytes(bmp[10..14].try_into().unwrap()) as usize, HEAD);
        assert_eq!(u32::from_le_bytes(bmp[14..18].try_into().unwrap()), 124);
        assert_eq!(i32::from_le_bytes(bmp[18..22].try_into().unwrap()), 480);
        assert_eq!(i32::from_le_bytes(bmp[22..26].try_into().unwrap()), 800);
        assert_eq!(u16::from_le_bytes(bmp[28..30].try_into().unwrap()), 24);
        assert_eq!(bmp.len(), HEAD + 480 * 800 * 3);
        assert_eq!(u32::from_le_bytes(bmp[2..6].try_into().unwrap()) as usize, bmp.len());
    }

    #[test]
    fn rows_are_bottom_up_and_bgr() {
        let mut image = RgbImage::new(2, 2);
        image.put_pixel(0, 0, Rgb([255, 0, 0])); // top-left, red
        image.put_pixel(1, 1, Rgb([0, 0, 255])); // bottom-right, blue
        let bmp = encode(&image);
        // 2 px * 3 bytes = 6, padded to a row size of 8.
        assert_eq!(bmp.len(), HEAD + 2 * 8);
        // First row on disk is the bottom row of the image.
        assert_eq!(&bmp[HEAD..HEAD + 6], &[0, 0, 0, /* bottom-right blue */ 255, 0, 0]);
        assert_eq!(&bmp[HEAD + 6..HEAD + 8], &[0, 0]); // row padding
        // Second row on disk is the top row: red arrives as B,G,R.
        assert_eq!(&bmp[HEAD + 8..HEAD + 14], &[0, 0, 255, 0, 0, 0]);
    }

    #[test]
    fn odd_widths_are_padded_to_four_bytes() {
        let bmp = encode(&RgbImage::new(3, 1));
        // 3 px * 3 bytes = 9, padded to 12.
        assert_eq!(bmp.len(), HEAD + 12);
    }

    #[test]
    fn decodes_back_to_the_same_pixels() {
        let mut image = RgbImage::new(5, 3);
        for (x, y, pixel) in image.enumerate_pixels_mut() {
            *pixel = Rgb([(x * 40) as u8, (y * 60) as u8, 7]);
        }
        let bmp = encode(&image);
        let decoded = image::load_from_memory_with_format(&bmp, image::ImageFormat::Bmp)
            .expect("re-read encoded bmp")
            .to_rgb8();
        assert_eq!(decoded, image);
    }
}
