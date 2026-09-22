import type { Language } from './i18n'
import type { ThemeSetting } from './theme'

/** Colours the panel can actually show, mirroring `epaper-core::palette`. */
export const PALETTE = {
	black: '#000000',
	white: '#ffffff',
	green: '#00ff00',
	blue: '#0000ff',
	red: '#ff0000',
	yellow: '#ffff00',
	orange: '#ff8000',
} as const

export type PaletteColor = keyof typeof PALETTE

/** Accents that stay readable on white. Yellow does not, so it is left out. */
export type AccentColor = 'red' | 'orange' | 'green' | 'blue' | 'black'

export const ACCENT_COLORS: AccentColor[] = ['red', 'orange', 'green', 'blue', 'black']

export function isAccentColor(value: unknown): value is AccentColor {
	return ACCENT_COLORS.includes(value as AccentColor)
}

export type Orientation = 'portrait' | 'landscape'
export type Fit = 'cover' | 'contain'

/**
 * The page designs a panel can be drawn in.
 *
 * `classic` is the layout the app has always drawn. The other five are the
 * designs from the panel brief, laid out for a portrait 480x800 panel.
 */
export type PanelTemplate = 'classic' | 'masthead' | 'ledger' | 'tiles' | 'poster' | 'agenda'

export const PANEL_TEMPLATES: PanelTemplate[] = [
	'classic',
	'masthead',
	'ledger',
	'tiles',
	'poster',
	'agenda',
]

export function isPanelTemplate(value: unknown): value is PanelTemplate {
	return PANEL_TEMPLATES.includes(value as PanelTemplate)
}

export interface Birthday {
	id: string
	name: string
	/** `YYYY-MM-DD`. The year is the year of birth, and drives the age. */
	date: string
}

export interface SpecialEvent {
	id: string
	name: string
	/** `YYYY-MM-DD`, the first day. */
	date: string
	/** Days the event lasts. A 9-day trip collapses to a single page. */
	duration: number
}

/** How often a chore comes round. */
export type ChoreFrequency = 'daily' | 'weekly' | 'fortnightly' | 'monthly'

export const CHORE_FREQUENCIES: ChoreFrequency[] = ['daily', 'weekly', 'fortnightly', 'monthly']

export function isChoreFrequency(value: unknown): value is ChoreFrequency {
	return CHORE_FREQUENCIES.includes(value as ChoreFrequency)
}

/**
 * A recurring job and who is next to do it.
 *
 * One anchor date carries both halves: it is the first time the chore is due,
 * and the start of the rotation — so the weekday of a weekly chore and whose
 * turn it is on any later day both fall out of it, with nothing to keep in
 * step by hand.
 */
export interface Chore {
	id: string
	name: string
	/** Names that take turns, in order. Empty means nobody in particular. */
	people: string[]
	frequency: ChoreFrequency
	/** `YYYY-MM-DD`, the first time it is due. */
	startDate: string
}

export interface Photo {
	id: string
	/** Absolute path on disk; the file is read by the Rust side, not the UI. */
	path: string
	name: string
	fit: Fit
	autoRotate: boolean
	dither: boolean
}

export interface Settings {
	/**
	 * The app's own language, which is separate from `locale`: the pages can be
	 * printed in German while the app is read in English, or the other way round.
	 */
	uiLanguage: Language
	/** A cascivo theme name, or `system` to follow the OS. */
	theme: ThemeSetting
	/** BCP 47 tag; drives every weekday, month and "N days" string on the pages. */
	locale: string
	weekStartsOn: 0 | 1
	/** `YYYY-MM-DD` of the first page. */
	startDate: string
	numberOfDays: number
	width: number
	height: number
	fontFamily: string
	/** Which page design is drawn. */
	template: PanelTemplate
	accentColor: PaletteColor
	/** How many entries the event list shows at most. */
	maxEvents: number
	/** How far ahead to look for upcoming birthdays, in days. */
	lookaheadDays: number
	showAges: boolean
	/** How many chores a page lists at most. Zero leaves them off the page. */
	maxChores: number
	/**
	 * Give a multi-day event a single page instead of one per day, the way the
	 * original script did — a nine-day trip reads as one entry.
	 */
	collapseMultiDayEvents: boolean
}

export type ExportContent = 'calendar' | 'photos' | 'both'
export type PhotoPlacement = 'append' | 'interleave'

export interface ExportSettings {
	outputDir: string | null
	content: ExportContent
	photoPlacement: PhotoPlacement
	/** Clear `pic/`, `fileList.txt` and the device's index file first. */
	clearBeforeWrite: boolean
}

export interface Project {
	version: 1
	settings: Settings
	birthdays: Birthday[]
	events: SpecialEvent[]
	chores: Chore[]
	photos: Photo[]
	exportSettings: ExportSettings
}

export interface DevicePreset {
	id: string
	label: string
	width: number
	height: number
}

export const DEVICE_PRESETS: DevicePreset[] = [
	{ id: 'photopainter-portrait', label: 'PhotoPainter 7.3" — portrait', width: 480, height: 800 },
	{ id: 'photopainter-landscape', label: 'PhotoPainter 7.3" — landscape', width: 800, height: 480 },
]

export function orientationOf(width: number, height: number): Orientation {
	return width >= height ? 'landscape' : 'portrait'
}
