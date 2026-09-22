import { formatDate } from './date'
import { detectLanguage } from './i18n'
import { normaliseLocale } from './render/locale'
import type { Project, Settings } from './types'

/** A sensible starting point: today, four weeks of pages, the user's locale. */
export function defaultSettings(): Settings {
	return {
		uiLanguage: detectLanguage(),
		theme: 'brutalist',
		locale: pickLocale(),
		weekStartsOn: 1,
		startDate: formatDate(new Date()),
		numberOfDays: 30,
		width: 480,
		height: 800,
		fontFamily: 'Inter',
		template: 'classic',
		accentColor: 'red',
		maxEvents: 4,
		lookaheadDays: 30,
		showAges: true,
		maxChores: 3,
		collapseMultiDayEvents: true,
	}
}

export function defaultProject(): Project {
	return {
		version: 1,
		settings: defaultSettings(),
		birthdays: [],
		events: [],
		chores: [],
		photos: [],
		exportSettings: {
			outputDir: null,
			content: 'calendar',
			photoPlacement: 'append',
			clearBeforeWrite: true,
		},
	}
}

function pickLocale(): string {
	const preferred = typeof navigator === 'undefined' ? undefined : navigator.language
	return preferred ? normaliseLocale(preferred) : 'en-GB'
}

export function newId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2, 11)}`
}

/** The fonts shipped with the app, so pages look the same on every machine. */
export const FONT_FAMILIES = ['Inter', 'Helvetica', 'Arial', 'Georgia', 'Courier New']
