import type { Fit } from '../types'
import { invoke } from './host'

export interface ImageOptions {
	width: number
	height: number
	fit: Fit
	autoRotate: boolean
	dither: boolean
}

export interface PreparedOutput {
	pictureDir: string
	removed: string[]
}

export interface FirmwareImage {
	fileName: string
	intervalHours: number
}

/** Create `pic/` under the SD card root, optionally clearing the last run. */
export function prepareOutput(root: string, clear: boolean): Promise<PreparedOutput> {
	return invoke('prepare_output', { root, clear })
}

/** Hand a rendered page to Rust, which writes it as a 24-bit BMP. */
export function savePage(
	root: string,
	fileName: string,
	pngBase64: string,
	options: ImageOptions,
): Promise<void> {
	return invoke('save_page', { root, fileName, pngBase64, options })
}

/** Fit, dither and write a photo. The file never passes through the UI. */
export function savePhoto(
	root: string,
	fileName: string,
	sourcePath: string,
	options: ImageOptions,
): Promise<void> {
	return invoke('save_photo', { root, fileName, sourcePath, options })
}

/** A data URL showing what the panel will make of a photo. */
export function previewPhoto(sourcePath: string, options: ImageOptions): Promise<string> {
	return invoke('preview_photo', { sourcePath, options })
}

export function writeFileList(root: string, fileNames: string[]): Promise<string> {
	return invoke('write_file_list', { root, fileNames })
}

export function listFirmware(): Promise<FirmwareImage[]> {
	return invoke('list_firmware')
}

export function copyFirmware(fileName: string, targetDir: string): Promise<string> {
	return invoke('copy_firmware', { fileName, targetDir })
}

export function loadStoredProject(): Promise<string | null> {
	return invoke('load_project')
}

export function saveStoredProject(contents: string): Promise<string> {
	return invoke('save_project', { contents })
}

export function readTextFile(path: string): Promise<string> {
	return invoke('read_text_file', { path })
}

export function writeTextFile(path: string, contents: string): Promise<void> {
	return invoke('write_text_file', { path, contents })
}
