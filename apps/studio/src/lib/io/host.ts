import { invoke as tauriInvoke } from '@tauri-apps/api/core'
import * as dialog from '@tauri-apps/plugin-dialog'
import * as opener from '@tauri-apps/plugin-opener'

/*
 * The UI reaches Rust through Tauri's IPC in the app window. Where the system
 * webview is too old for it, the app serves the UI to a browser instead
 * (`src-tauri/src/browser.rs`), and the same calls go to that server — with
 * the token from the link it printed.
 */
const inApp = '__TAURI_INTERNALS__' in window
const token = new URLSearchParams(window.location.search).get('token') ?? ''

async function call<T>(command: string, args: object = {}): Promise<T> {
	const response = await fetch(`/api/${command}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-Epaper-Token': token },
		body: JSON.stringify(args),
	})
	// Rejects with the message itself, as Tauri's `invoke` does.
	if (!response.ok) throw await response.text()
	return (await response.json()) as T
}

export function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
	return inApp ? tauriInvoke<T>(command, args) : call<T>(command, args)
}

export function open<T extends dialog.OpenDialogOptions>(
	options: T,
): Promise<dialog.OpenDialogReturn<T>> {
	return inApp ? dialog.open(options) : call('dialog_open', options)
}

export function save(options: dialog.SaveDialogOptions): Promise<string | null> {
	return inApp ? dialog.save(options) : call('dialog_save', options)
}

export function openPath(path: string): Promise<void> {
	return inApp ? opener.openPath(path) : call('open_path', { path })
}

export function openUrl(url: string): Promise<void> {
	return inApp ? opener.openUrl(url) : call('open_url', { url })
}
