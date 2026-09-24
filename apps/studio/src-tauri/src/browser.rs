//! Browser mode, for systems whose webview is too old for the UI (see
//! `webview`). The app window then shows only a plain page with a link, and a
//! server on this computer serves the UI to whichever browser the user opens
//! it in. The UI reaches Rust through that server instead of Tauri's IPC —
//! the same commands, plus the file pickers and "open" calls its plugins make.
//!
//! The server can read and write any file the user can, so it only answers on
//! 127.0.0.1, only to requests addressed to it as 127.0.0.1 or localhost (no
//! DNS rebinding), and API calls only with the random token from the link. Other
//! sites open in the same browser never see the token, and a custom header
//! keeps them from even sending a call without a CORS preflight, which this
//! server never answers.

use crate::commands::{self, ImageOptions};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::thread;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_dialog::{DialogExt, FileDialogBuilder, FilePath};
use tauri_plugin_opener::OpenerExt;
use tiny_http::{Header, Method, Request, Response, Server};

/// The header the UI sends the token in.
const TOKEN_HEADER: &str = "X-Epaper-Token";

/// The only site the UI links to, as the opener capability allows it.
const AUTHOR_URL: &str = "https://u11g.com";

/// Start the server and open the window that shows its link.
pub fn start(app: &AppHandle, engine: &str) -> Result<(), Box<dyn std::error::Error>> {
    let server = Server::http("127.0.0.1:0").map_err(|error| error.to_string())?;
    let port = server
        .server_addr()
        .to_ip()
        .ok_or("the server has no TCP address")?
        .port();
    let guard = Guard::new(port, new_token().map_err(|error| error.to_string())?);
    let url = format!("http://127.0.0.1:{port}/?token={}", guard.token);

    let handle = app.clone();
    thread::spawn(move || {
        for request in server.incoming_requests() {
            let (app, guard) = (handle.clone(), guard.clone());
            // A file picker blocks its request until it closes; the UI keeps
            // loading and calling meanwhile.
            thread::spawn(move || respond(&app, &guard, request));
        }
    });

    let page = serde_json::json!({ "url": url, "engine": engine });
    WebviewWindowBuilder::new(app, "launch", WebviewUrl::App("browser-mode.html".into()))
        .title("E-Paper Studio")
        .inner_size(640.0, 520.0)
        .initialization_script(format!("window.__EPAPER_BROWSER_MODE__ = {page};"))
        .build()?;
    Ok(())
}

fn new_token() -> Result<String, getrandom::Error> {
    let mut bytes = [0u8; 32];
    getrandom::fill(&mut bytes)?;
    Ok(bytes.iter().map(|byte| format!("{byte:02x}")).collect())
}

#[derive(Clone)]
struct Guard {
    /// `localhost` as well as the address in the link: browsers never ask DNS
    /// for it, so it cannot be rebound to another site either.
    hosts: [String; 2],
    token: String,
}

impl Guard {
    fn new(port: u16, token: String) -> Self {
        Guard {
            hosts: [format!("127.0.0.1:{port}"), format!("localhost:{port}")],
            token,
        }
    }

    fn allows_host(&self, host: Option<&str>) -> bool {
        host.is_some_and(|host| self.hosts.iter().any(|allowed| allowed == host))
    }

    /// Browsers always send `Origin` on a cross-site call, so one that is
    /// missing can only come from outside a browser — which still needs the token.
    fn allows_call(&self, origin: Option<&str>, token: Option<&str>) -> bool {
        origin.map_or(true, |origin| {
            self.allows_host(origin.strip_prefix("http://"))
        }) && token.is_some_and(|token| same(token.as_bytes(), self.token.as_bytes()))
    }
}

/// Compares in constant time, so the token cannot be guessed byte by byte.
fn same(a: &[u8], b: &[u8]) -> bool {
    a.len() == b.len() && a.iter().zip(b).fold(0, |diff, (x, y)| diff | (x ^ y)) == 0
}

fn header<'a>(request: &'a Request, name: &str) -> Option<&'a str> {
    request
        .headers()
        .iter()
        .find(|header| header.field.as_str().as_str().eq_ignore_ascii_case(name))
        .map(|header| header.value.as_str())
}

fn respond(app: &AppHandle, guard: &Guard, mut request: Request) {
    let response = if !guard.allows_host(header(&request, "Host")) {
        text(403, "wrong host".into())
    } else if let Some(command) = request.url().strip_prefix("/api/").map(str::to_owned) {
        if *request.method() != Method::Post {
            text(405, "use POST".into())
        } else if !guard.allows_call(header(&request, "Origin"), header(&request, TOKEN_HEADER)) {
            text(403, "missing or wrong token".into())
        } else {
            let mut body = String::new();
            match request.as_reader().read_to_string(&mut body) {
                Err(error) => text(400, error.to_string()),
                Ok(_) => match call(app, &command, &body) {
                    Ok(value) => Response::from_string(value.to_string())
                        .with_header(content_type("application/json")),
                    Err(error) => text(500, error),
                },
            }
        }
    } else {
        asset(app, request.url())
    };
    // The browser may have gone away; there is nobody left to tell.
    let _ = request.respond(response);
}

/// `tauri dev` embeds no UI: the window loads it from the Vite dev server, and
/// so does the browser, through here.
#[cfg(dev)]
fn asset(app: &AppHandle, url: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    match &app.config().build.dev_url {
        Some(dev_url) => from_dev_server(dev_url, url)
            .unwrap_or_else(|error| text(502, format!("{dev_url} did not answer: {error}"))),
        None => embedded(app, url),
    }
}

#[cfg(not(dev))]
fn asset(app: &AppHandle, url: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    embedded(app, url)
}

/// HTTP/1.0, so the dev server answers with the plain body and closes.
#[cfg(dev)]
fn from_dev_server(
    dev_url: &tauri::Url,
    url: &str,
) -> std::io::Result<Response<std::io::Cursor<Vec<u8>>>> {
    use std::io::{Error, Read, Write};

    let host = dev_url.host_str().unwrap_or("localhost");
    let port = dev_url.port_or_known_default().unwrap_or(80);
    let mut stream = std::net::TcpStream::connect((host, port))?;
    write!(stream, "GET {url} HTTP/1.0\r\nHost: {host}:{port}\r\n\r\n")?;
    let mut raw = Vec::new();
    stream.read_to_end(&mut raw)?;

    let end = raw
        .windows(4)
        .position(|window| window == b"\r\n\r\n")
        .ok_or_else(|| Error::other("the response has no end of headers"))?;
    let head = String::from_utf8_lossy(&raw[..end]).into_owned();
    let mut lines = head.lines();
    let status = lines
        .next()
        .and_then(|line| line.split(' ').nth(1))
        .and_then(|code| code.parse().ok())
        .unwrap_or(502);
    let mut response = Response::from_data(raw[end + 4..].to_vec()).with_status_code(status);
    for (name, value) in lines.filter_map(|line| line.split_once(':')) {
        if name.eq_ignore_ascii_case("content-type") {
            if let Ok(header) = Header::from_bytes("Content-Type", value.trim()) {
                response.add_header(header);
            }
        }
    }
    Ok(response)
}

fn embedded(app: &AppHandle, url: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    let path = url.split(['?', '#']).next().unwrap_or("/");
    match app.asset_resolver().get(path.to_string()) {
        None => text(404, format!("{path} not found")),
        Some(asset) => {
            let mut response =
                Response::from_data(asset.bytes).with_header(content_type(&asset.mime_type));
            if let Some(csp) = asset.csp_header {
                if let Ok(header) = Header::from_bytes("Content-Security-Policy", csp) {
                    response.add_header(header);
                }
            }
            response
        }
    }
}

fn text(status: u16, message: String) -> Response<std::io::Cursor<Vec<u8>>> {
    Response::from_string(message)
        .with_status_code(status)
        .with_header(content_type("text/plain; charset=utf-8"))
}

fn content_type(value: &str) -> Header {
    Header::from_bytes("Content-Type", value).expect("a MIME type is a valid header value")
}

fn args<T: DeserializeOwned>(body: &str) -> Result<T, String> {
    serde_json::from_str(body).map_err(|error| format!("bad arguments: {error}"))
}

fn reply<T: Serialize>(result: Result<T, String>) -> Result<Value, String> {
    result.and_then(|value| serde_json::to_value(value).map_err(|error| error.to_string()))
}

/// What `invoke` would have done in the app window: the same commands, with
/// the arguments named as the UI names them.
fn call(app: &AppHandle, command: &str, body: &str) -> Result<Value, String> {
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Page {
        root: String,
        file_name: String,
        png_base64: String,
        options: ImageOptions,
    }
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Photo {
        root: String,
        file_name: String,
        source_path: String,
        options: ImageOptions,
    }
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Preview {
        source_path: String,
        options: ImageOptions,
    }
    #[derive(Deserialize)]
    struct Prepare {
        root: String,
        clear: bool,
    }
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct FileList {
        root: String,
        file_names: Vec<String>,
    }
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Firmware {
        file_name: String,
        target_dir: String,
    }
    #[derive(Deserialize)]
    struct Contents {
        contents: String,
    }
    #[derive(Deserialize)]
    struct PathOnly {
        path: String,
    }
    #[derive(Deserialize)]
    struct TextFile {
        path: String,
        contents: String,
    }
    #[derive(Deserialize)]
    struct Url {
        url: String,
    }

    match command {
        "prepare_output" => {
            let a: Prepare = args(body)?;
            reply(commands::prepare_output(a.root, a.clear))
        }
        "save_page" => {
            let a: Page = args(body)?;
            reply(commands::save_page(
                a.root,
                a.file_name,
                a.png_base64,
                a.options,
            ))
        }
        "save_photo" => {
            let a: Photo = args(body)?;
            reply(commands::save_photo(
                a.root,
                a.file_name,
                a.source_path,
                a.options,
            ))
        }
        "preview_photo" => {
            let a: Preview = args(body)?;
            reply(commands::preview_photo(a.source_path, a.options))
        }
        "write_file_list" => {
            let a: FileList = args(body)?;
            reply(commands::write_file_list(a.root, a.file_names))
        }
        "list_firmware" => reply(commands::list_firmware(app.clone())),
        "copy_firmware" => {
            let a: Firmware = args(body)?;
            reply(commands::copy_firmware(
                app.clone(),
                a.file_name,
                a.target_dir,
            ))
        }
        "load_project" => reply(commands::load_project(app.clone())),
        "save_project" => {
            let a: Contents = args(body)?;
            reply(commands::save_project(app.clone(), a.contents))
        }
        "read_text_file" => {
            let a: PathOnly = args(body)?;
            reply(commands::read_text_file(a.path))
        }
        "write_text_file" => {
            let a: TextFile = args(body)?;
            reply(commands::write_text_file(a.path, a.contents))
        }
        "dialog_open" => reply(Ok(pick(app, args(body)?))),
        "dialog_save" => {
            let options: DialogOptions = args(body)?;
            reply(Ok(dialog(app, &options)
                .blocking_save_file()
                .map(|path| path.to_string())))
        }
        "open_path" => {
            let a: PathOnly = args(body)?;
            reply(
                app.opener()
                    .open_path(a.path, None::<&str>)
                    .map_err(|error| error.to_string()),
            )
        }
        "open_url" => {
            let a: Url = args(body)?;
            if a.url != AUTHOR_URL && !a.url.starts_with(&format!("{AUTHOR_URL}/")) {
                return Err(format!("{} is not a link the app opens", a.url));
            }
            reply(
                app.opener()
                    .open_url(a.url, None::<&str>)
                    .map_err(|error| error.to_string()),
            )
        }
        _ => Err(format!("unknown command {command}")),
    }
}

/// The options of `@tauri-apps/plugin-dialog` the UI uses.
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct DialogOptions {
    title: Option<String>,
    filters: Vec<DialogFilter>,
    default_path: Option<String>,
    multiple: bool,
    directory: bool,
}

#[derive(Deserialize)]
struct DialogFilter {
    name: String,
    extensions: Vec<String>,
}

fn dialog(app: &AppHandle, options: &DialogOptions) -> FileDialogBuilder<tauri::Wry> {
    // The picker belongs to this app, not the browser, and would open behind
    // it; bringing the app forward first brings the picker with it.
    if let Some(window) = app.get_webview_window("launch") {
        let _ = window.set_focus();
    }
    let mut dialog = app.dialog().file();
    if let Some(title) = &options.title {
        dialog = dialog.set_title(title);
    }
    for filter in &options.filters {
        let extensions: Vec<&str> = filter.extensions.iter().map(String::as_str).collect();
        dialog = dialog.add_filter(&filter.name, &extensions);
    }
    if let Some(name) = &options.default_path {
        dialog = dialog.set_file_name(name);
    }
    dialog
}

/// `open()` answers with one path or a list, as the options asked for.
fn pick(app: &AppHandle, options: DialogOptions) -> Value {
    let dialog = dialog(app, &options);
    let paths = |paths: Option<Vec<FilePath>>| {
        paths.map(|paths| paths.iter().map(ToString::to_string).collect::<Vec<_>>())
    };
    match (options.directory, options.multiple) {
        (true, true) => serde_json::json!(paths(dialog.blocking_pick_folders())),
        (true, false) => {
            serde_json::json!(dialog.blocking_pick_folder().map(|path| path.to_string()))
        }
        (false, true) => serde_json::json!(paths(dialog.blocking_pick_files())),
        (false, false) => {
            serde_json::json!(dialog.blocking_pick_file().map(|path| path.to_string()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{new_token, same, Guard};

    fn guard() -> Guard {
        Guard::new(4321, "secret".into())
    }

    #[test]
    fn only_requests_addressed_to_this_computer_are_served() {
        assert!(guard().allows_host(Some("127.0.0.1:4321")));
        assert!(guard().allows_host(Some("localhost:4321")));
        assert!(!guard().allows_host(Some("localhost:9999")));
        assert!(!guard().allows_host(Some("attacker.example:4321")));
        assert!(!guard().allows_host(None));
    }

    #[test]
    fn calls_need_the_token() {
        assert!(guard().allows_call(Some("http://127.0.0.1:4321"), Some("secret")));
        assert!(guard().allows_call(Some("http://localhost:4321"), Some("secret")));
        assert!(guard().allows_call(None, Some("secret")));
        assert!(!guard().allows_call(Some("http://127.0.0.1:4321"), Some("secreT")));
        assert!(!guard().allows_call(Some("http://127.0.0.1:4321"), Some("secret!")));
        assert!(!guard().allows_call(Some("http://127.0.0.1:4321"), None));
    }

    #[test]
    fn calls_from_other_sites_are_refused_even_with_the_token() {
        assert!(!guard().allows_call(Some("https://attacker.example"), Some("secret")));
        assert!(!guard().allows_call(Some("http://127.0.0.1:9999"), Some("secret")));
        assert!(!guard().allows_call(Some("https://localhost:4321"), Some("secret")));
    }

    #[test]
    fn tokens_are_long_and_fresh() {
        let (a, b) = (new_token().unwrap(), new_token().unwrap());
        assert_eq!(a.len(), 64);
        assert_ne!(a, b);
    }

    #[test]
    fn comparison_needs_equal_bytes_and_length() {
        assert!(same(b"abc", b"abc"));
        assert!(!same(b"abc", b"abd"));
        assert!(!same(b"abc", b"ab"));
    }
}
