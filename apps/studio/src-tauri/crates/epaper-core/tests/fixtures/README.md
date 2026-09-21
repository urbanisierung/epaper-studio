# BMP fixtures

`*-imagemagick.bmp` is what the original pipeline produced, and what
`tests/imagemagick_parity.rs` holds the Rust writer to. Regenerate with
ImageMagick installed:

```bash
convert -size 7x5 gradient:red-blue -type truecolor sample-7x5.png
convert -size 4x3 -define gradient:angle=90 gradient:yellow-black -type truecolor sample-4x3.png
for f in sample-7x5 sample-4x3; do convert "$f.png" -type truecolor "$f-imagemagick.bmp"; done
```
