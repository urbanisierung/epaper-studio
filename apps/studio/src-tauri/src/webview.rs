//! The UI renders with the system's own web engine — WebView2 on Windows,
//! WebKit on macOS — which can be older than the UI needs. The UI explains that
//! itself when it can load at all; this catches it earlier, before any window
//! opens, with a native message box that needs no webview. On macOS it is also
//! the only place that can name the version: WebKit's user agent is frozen.
//!
//! On macOS the version that counts is not Safari's. A Safari update on an older
//! macOS stages its newer WebKit for Safari alone; every other app keeps the
//! WebKit that came with the system. Monterey with Safari 17.6 still gives apps
//! Safari 15's engine, so this reads the WebKit loaded into this process.

/// cascivo's floor: the Popover API it relies on arrived in Chromium 114.
#[cfg(any(windows, test))]
const MIN_WEBVIEW2_MAJOR: u32 = 114;

/// cascivo's floor on macOS, Safari 17.4, shipped WebKit 618 — as the system's
/// own WebKit from macOS 14.4 Sonoma on.
#[cfg(any(target_os = "macos", test))]
const MIN_WEBKIT_BUILD: u32 = 618;

/// Shows an error and exits if WebView2 is too old to run the UI.
#[cfg(windows)]
pub fn exit_if_unsupported() {
    // An unreadable version is left to Tauri, which reports a missing runtime
    // itself; refusing to start on a detection hiccup would be worse.
    let Ok(version) = tauri::webview_version() else {
        return;
    };
    if !too_old(&version) {
        return;
    }
    rfd::MessageDialog::new()
        .set_level(rfd::MessageLevel::Error)
        .set_title("E-Paper Studio")
        .set_description(format!(
            "E-Paper Studio needs Microsoft Edge WebView2 Runtime {MIN_WEBVIEW2_MAJOR} or later, \
             but this computer has {version}. Update it under Settings → Apps, or install the \
             current version from Microsoft, then start the app again.\n\n\
             E-Paper Studio braucht Microsoft Edge WebView2 Runtime {MIN_WEBVIEW2_MAJOR} oder neuer, \
             auf diesem Computer ist {version} installiert. Aktualisiere sie unter Einstellungen → \
             Apps oder installiere die aktuelle Version von Microsoft, dann starte die App neu."
        ))
        .show();
    std::process::exit(1);
}

/// Shows an error and exits if the system WebKit is too old to run the UI.
#[cfg(target_os = "macos")]
pub fn exit_if_unsupported() {
    // As on Windows: a version that cannot be read does not block the app.
    let Ok(version) = tauri::webview_version() else {
        return;
    };
    if !webkit_too_old(&version) {
        return;
    }
    rfd::MessageDialog::new()
        .set_level(rfd::MessageLevel::Error)
        .set_title("E-Paper Studio")
        .set_description(format!(
            "E-Paper Studio needs macOS 14.4 Sonoma or later. Apps draw with the web engine \
             that comes with macOS, and the one on this Mac is too old (WebKit {version}). \
             Installing a newer Safari does not change it — only Safari itself uses that. \
             Update macOS under System Settings → General → Software Update, if this Mac \
             supports it.\n\n\
             E-Paper Studio braucht macOS 14.4 Sonoma oder neuer. Apps zeichnen mit dem \
             Browser-Baustein, der mit macOS kommt, und der ist auf diesem Mac zu alt \
             (WebKit {version}). Ein neueres Safari ändert daran nichts — das nutzt nur Safari \
             selbst. Aktualisiere macOS unter Systemeinstellungen → Allgemein → Softwareupdate, \
             falls dieser Mac das unterstützt."
        ))
        .show();
    std::process::exit(1);
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
