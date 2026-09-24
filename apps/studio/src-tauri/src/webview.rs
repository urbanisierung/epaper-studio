//! Windows renders the UI with the system's WebView2, which can be older than
//! the UI needs when its updates are blocked. The UI explains that itself when
//! it can load at all; this catches it earlier, before any window opens, with a
//! native message box that needs no webview.

/// cascivo's floor: the Popover API it relies on arrived in Chromium 114.
#[cfg(any(windows, test))]
const MIN_WEBVIEW2_MAJOR: u32 = 114;

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

#[cfg(any(windows, test))]
fn too_old(version: &str) -> bool {
    version
        .split('.')
        .next()
        .and_then(|major| major.parse::<u32>().ok())
        .is_some_and(|major| major < MIN_WEBVIEW2_MAJOR)
}

#[cfg(test)]
mod tests {
    use super::too_old;

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
}
