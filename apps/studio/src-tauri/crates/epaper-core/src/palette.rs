//! The colours a Waveshare PhotoPainter panel can actually show.
//!
//! Same seven entries, in the same order, as the palette in the original
//! `scripts/convert.py`.

pub type Rgb = [u8; 3];

pub const BLACK: Rgb = [0, 0, 0];
pub const WHITE: Rgb = [255, 255, 255];
pub const GREEN: Rgb = [0, 255, 0];
pub const BLUE: Rgb = [0, 0, 255];
pub const RED: Rgb = [255, 0, 0];
pub const YELLOW: Rgb = [255, 255, 0];
pub const ORANGE: Rgb = [255, 128, 0];

pub const PALETTE: [Rgb; 7] = [BLACK, WHITE, GREEN, BLUE, RED, YELLOW, ORANGE];

/// Nearest palette entry by squared Euclidean distance in RGB.
pub fn nearest(color: Rgb) -> Rgb {
    let mut best = PALETTE[0];
    let mut best_distance = u32::MAX;
    for candidate in PALETTE {
        let distance = squared_distance(color, candidate);
        if distance < best_distance {
            best_distance = distance;
            best = candidate;
        }
    }
    best
}

fn squared_distance(a: Rgb, b: Rgb) -> u32 {
    let mut sum = 0u32;
    for channel in 0..3 {
        let delta = a[channel] as i32 - b[channel] as i32;
        sum += (delta * delta) as u32;
    }
    sum
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exact_palette_colors_map_to_themselves() {
        for color in PALETTE {
            assert_eq!(nearest(color), color);
        }
    }

    #[test]
    fn near_misses_snap_to_the_closest_entry() {
        assert_eq!(nearest([250, 250, 250]), WHITE);
        assert_eq!(nearest([12, 9, 3]), BLACK);
        assert_eq!(nearest([230, 20, 20]), RED);
        assert_eq!(nearest([240, 140, 10]), ORANGE);
    }
}
