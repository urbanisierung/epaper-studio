mod browser;
mod commands;
mod webview;

use tauri::WebviewWindowBuilder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        // The window is not created from the config, so a webview too old for
        // the UI never has to load it.
        .setup(|app| {
            match webview::unsupported() {
                Some(engine) => browser::start(app.handle(), &engine)?,
                None => {
                    WebviewWindowBuilder::from_config(app.handle(), &app.config().app.windows[0])?
                        .build()?;
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::prepare_output,
            commands::save_page,
            commands::save_photo,
            commands::preview_photo,
            commands::write_file_list,
            commands::list_firmware,
            commands::copy_firmware,
            commands::load_project,
            commands::save_project,
            commands::read_text_file,
            commands::write_text_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running E-Paper Studio");
}
