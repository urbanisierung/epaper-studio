import { type ImageOptions, prepareOutput, savePage, savePhoto, writeFileList } from './io/tauri'
import { drawPage } from './render/calendar'
import { ensureFont } from './render/fonts'
import { buildSchedule } from './render/schedule'
import type { Project } from './types'

/** The device is documented to hold 100 pictures. */
export const RECOMMENDED_MAX_PICTURES = 100

export interface ExportProgress {
	done: number
	total: number
	label: string
}

export interface ExportSummary {
	pictures: number
	fileListPath: string
	removed: string[]
}

export type LogLine = { kind: 'info' | 'warn' | 'error'; message: string }

/** How many pictures a run will write, for the count shown next to the button. */
export function plannedPictureCount(project: Project): number {
	const { content } = project.exportSettings
	const pages = content === 'photos' ? 0 : buildSchedule(project).length
	const photos = content === 'calendar' ? 0 : project.photos.length
	return pages + photos
}

/**
 * Renders every page, converts every photo, and writes `fileList.txt`.
 *
 * Pages are drawn on one reused canvas and handed to Rust as base64 PNGs;
 * photos are only named — Rust reads them off disk itself.
 */
export async function generate(
	project: Project,
	onProgress: (progress: ExportProgress) => void,
	log: (line: LogLine) => void,
): Promise<ExportSummary> {
	const root = project.exportSettings.outputDir
	if (!root) throw new Error('Choose where to write the pictures first.')

	// Pages are measured in the chosen font, so wait for it to be ready or the
	// first few pages come out in a fallback face.
	await ensureFont(project.settings.fontFamily)

	const { content, photoPlacement, clearBeforeWrite } = project.exportSettings
	const pages = content === 'photos' ? [] : buildSchedule(project)
	const photos = content === 'calendar' ? [] : project.photos

	const prepared = await prepareOutput(root, clearBeforeWrite)
	for (const path of prepared.removed) log({ kind: 'info', message: `Removed ${path}` })

	const total = pages.length + photos.length
	if (total === 0) throw new Error('There is nothing to write — no pages and no photos.')

	const canvas = document.createElement('canvas')
	const pageOptions: ImageOptions = {
		width: project.settings.width,
		height: project.settings.height,
		fit: 'cover',
		autoRotate: false,
		// Calendar pages are drawn in palette colours already; dithering them
		// would only add speckle.
		dither: false,
	}

	let done = 0
	const pageNames: string[] = []
	for (const page of pages) {
		drawPage(canvas, project, page.date)
		await savePage(root, page.fileName, canvas.toDataURL('image/png'), pageOptions)
		pageNames.push(page.fileName)
		done++
		onProgress({ done, total, label: page.fileName })
	}

	const photoNames: string[] = []
	for (const [index, photo] of photos.entries()) {
		const fileName = `photo_${String(index + 1).padStart(3, '0')}.bmp`
		try {
			await savePhoto(root, fileName, photo.path, {
				width: project.settings.width,
				height: project.settings.height,
				fit: photo.fit,
				autoRotate: photo.autoRotate,
				dither: photo.dither,
			})
			photoNames.push(fileName)
		} catch (error) {
			log({ kind: 'warn', message: `Skipped ${photo.name}: ${String(error)}` })
		}
		done++
		onProgress({ done, total, label: photo.name })
	}

	const order = interleaveOrder(pageNames, photoNames, photoPlacement)
	const fileListPath = await writeFileList(root, order)

	if (order.length > RECOMMENDED_MAX_PICTURES) {
		log({
			kind: 'warn',
			message: `${order.length} pictures written. The display is documented to handle ${RECOMMENDED_MAX_PICTURES}; anything beyond that may not show up.`,
		})
	}

	return { pictures: order.length, fileListPath, removed: prepared.removed }
}

/**
 * Display order. Appended photos follow the calendar; interleaved ones are
 * spread evenly between the pages so a photo turns up every few days.
 */
export function interleaveOrder(
	pages: string[],
	photos: string[],
	placement: 'append' | 'interleave',
): string[] {
	if (placement === 'append' || photos.length === 0 || pages.length === 0) {
		return [...pages, ...photos]
	}

	const spacing = pages.length / photos.length
	const order: string[] = []
	let nextPhoto = 0
	for (const [index, page] of pages.entries()) {
		order.push(page)
		while (nextPhoto < photos.length && (nextPhoto + 1) * spacing <= index + 1) {
			order.push(photos[nextPhoto])
			nextPhoto++
		}
	}
	order.push(...photos.slice(nextPhoto))
	return order
}
