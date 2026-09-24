//! The UI renders with the system's own web engine — WebView2 on Windows,
//! WebKit on macOS — which can be older than the UI needs. When it is, the app
//! serves the UI to a browser instead (see `browser`). This decides that before
//! any window opens; on macOS it is also the only place that can tell, because
//! WebKit's user agent is frozen.
//!
//! On macOS the version that counts is not Safari's. A Safari update on an older
//! macOS stages its newer WebKit for Safari alone; every other app keeps the
//! WebKit that came with the system. Monterey with Safari 17.6 still gives apps
//! Safari 15's engine, so this reads the WebKit loaded into this process.

/// Set to anything to use browser mode on a system whose webview is fine — the
/// only way to try it on a current machine.
const FORCE_BROWSER_MODE: &str = "EPAPER_STUDIO_BROWSER_MODE";

/// cascivo's floor: the Popover API it relies on arrived in Chromium 114.
#[cfg(any(windows, test))]
const MIN_WEBVIEW2_MAJOR: u32 = 114;

/// cascivo's floor on macOS, Safari 17.4, shipped WebKit 618 — as the system's
/// own WebKit from macOS 14.4 Sonoma on.
#[cfg(any(target_os = "macos", test))]
const MIN_WEBKIT_BUILD: u32 = 618;

/// The webview's version when it is too old to run the UI, `None` when the app
/// window can show it.
pub fn unsupported() -> Option<String> {
    if std::env::var_os(FORCE_BROWSER_MODE).is_some() {
        return Some(format!("{FORCE_BROWSER_MODE} is set"));
    }
    // An unreadable version does not block the app: refusing to start on a
    // detection hiccup would be worse, and Tauri reports a missing runtime itself.
    let version = tauri::webview_version().ok()?;
    engine_too_old(&version).then_some(version)
}

#[cfg(windows)]
fn engine_too_old(version: &str) -> bool {
    too_old(version)
}

#[cfg(target_os = "macos")]
fn engine_too_old(version: &str) -> bool {
    webkit_too_old(version)
}

/// Linux is not checked: WebKitGTK arrives with the distribution's own updates.
#[cfg(not(any(windows, target_os = "macos")))]
fn engine_too_old(_version: &str) -> bool {
    false
}

#[cfg(any(windows, test))]
fn too_old(version: &str) -> bool {
    version
        .split('.')
        .next()
        .and_then(|major| major.parse::<u32>().ok())
        .is_some_and(|major| major < MIN_WEBVIEW2_MAJOR)
}

/// macOS puts the OS in front of WebKit's own build number: `17618.3.11.11.7`
/// is WebKit 618 on Monterey, `20619.1.26.31.6` WebKit 619 on Sequoia. Only
/// the last three digits of the first part say which WebKit it is.
#[cfg(any(target_os = "macos", test))]
fn webkit_too_old(version: &str) -> bool {
    version
        .split('.')
        .next()
        .and_then(|first| first.parse::<u32>().ok())
        .is_some_and(|first| first % 1000 < MIN_WEBKIT_BUILD)
}

#[cfg(test)]
mod tests {
    use super::{too_old, webkit_too_old};

    #[test]
    fn versions_below_the_floor_are_too_old() {
        assert!(too_old("109.0.1518.140"));
        assert!(too_old("113.0.1774.57"));
    }

    #[test]
    fn versions_at_or_above_the_floor_are_fine() {
        assert!(!too_old("114.0.1823.37"));
        assert!(!too_old("140.0.3485.54"));
    }

    #[test]
    fn an_unparseable_version_does_not_block_the_app() {
        assert!(!too_old(""));
        assert!(!too_old("unknown"));
    }

    #[test]
    fn webkit_below_safari_17_4_is_too_old() {
        // WebKit 612, 615 and 617: Safari 15, 16.6 and 17.3.
        assert!(webkit_too_old("17612.1.29.41.4"));
        assert!(webkit_too_old("17615.3.12.11.3"));
        assert!(webkit_too_old("17617.2.4.11.12"));
    }

    #[test]
    fn webkit_from_safari_17_4_on_is_fine() {
        // WebKit 618 (Safari 17.4–17.6) and later.
        assert!(!webkit_too_old("17618.3.11.11.7"));
        assert!(!webkit_too_old("19618.1.15.11.14"));
        assert!(!webkit_too_old("20619.1.26.31.6"));
        assert!(!webkit_too_old("21622.1.22.11.14"));
    }

    #[test]
    fn an_unparseable_webkit_version_does_not_block_the_app() {
        assert!(!webkit_too_old(""));
        assert!(!webkit_too_old("unknown"));
    }
}
