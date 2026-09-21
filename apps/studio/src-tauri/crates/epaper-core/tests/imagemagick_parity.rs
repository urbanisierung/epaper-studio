//! Pins the BMP writer to real `convert <png> -type truecolor <bmp>` output.
//!
//! The display has only ever been fed ImageMagick's BMPs, so the replacement
//! has to produce the same bytes — header included, not just the pixels. The
//! fixtures were made with ImageMagick 6.9.12; `tests/fixtures/README.md` says
//! how to regenerate them.

use epaper_core::bmp;

fn assert_matches_imagemagick(stem: &str) {
    let dir = concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures");
    let source = image::open(format!("{dir}/{stem}.png"))
        .expect("read fixture png")
        .to_rgb8();
    let expected = std::fs::read(format!("{dir}/{stem}-imagemagick.bmp")).expect("read fixture bmp");

    let ours = bmp::encode(&source);

    assert_eq!(ours.len(), expected.len(), "{stem}: file size differs");
    assert_eq!(&ours[..138], &expected[..138], "{stem}: header differs");
    assert_eq!(&ours[138..], &expected[138..], "{stem}: pixel data differs");
}

#[test]
fn matches_imagemagick_with_row_padding() {
    // 7 px wide: 21 bytes a row, padded to 24.
    assert_matches_imagemagick("sample-7x5");
}

#[test]
fn matches_imagemagick_without_row_padding() {
    // 4 px wide: 12 bytes a row, already aligned.
    assert_matches_imagemagick("sample-4x3");
}
