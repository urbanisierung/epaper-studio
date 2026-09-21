mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
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
