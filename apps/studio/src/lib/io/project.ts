import { formatDate, isValidDate, parseDate } from '../date'
import { defaultProject, defaultSettings, newId } from '../defaults'
import { isLanguage } from '../i18n'
import { isThemeSetting } from '../theme'
import { isAccentColor, isChoreFrequency, isPanelTemplate, type Project } from '../types'

/**
 * The whole project is one JSON file: autosaved so nothing is lost between
 * sessions, and exportable so it can be backed up or handed to someone else.
 *
 * Reading is deliberately forgiving — a hand-edited or older file should load
 * with defaults filled in rather than fail.
 */
export function serialiseProject(project: Project): string {
	return `${JSON.stringify(project, null, 2)}\n`
}

export function parseProject(text: string): Project {
	let raw: unknown
	try {
		raw = JSON.parse(text)
	} catch {
		throw new Error('That file is not valid JSON.')
	}
	if (typeof raw !== 'object' || raw === null) {
		throw new Error('That file does not contain a project.')
	}

	const source = raw as Record<string, unknown>
	const base = defaultProject()
	const settings = { ...defaultSettings(), ...asRecord(source.settings) }

	return {
		version: 1,
		settings: {
			...settings,
			uiLanguage: isLanguage(settings.uiLanguage)
				? settings.uiLanguage
				: defaultSettings().uiLanguage,
			theme: isThemeSetting(settings.theme) ? settings.theme : defaultSettings().theme,
			accentColor: isAccentColor(settings.accentColor) ? settings.accentColor : 'red',
			template: isPanelTemplate(settings.template) ? settings.template : 'classic',
			numberOfDays: clamp(Number(settings.numberOfDays) || 30, 1, 400),
			maxEvents: clamp(Number(settings.maxEvents) || 4, 1, 10),
			maxChores: clamp(finite(settings.maxChores, 3), 0, 6),
			lookaheadDays: clamp(Number(settings.lookaheadDays) || 30, 1, 365),
			width: clamp(Number(settings.width) || 480, 100, 4000),
			height: clamp(Number(settings.height) || 800, 100, 4000),
			startDate: isValidDate(parseDate(String(settings.startDate)))
				? String(settings.startDate)
				: formatDate(new Date()),
		},
		birthdays: asArray(source.birthdays).flatMap((entry) => {
			const item = asRecord(entry)
			const name = String(item.name ?? '').trim()
			const date = String(item.date ?? '')
			if (!name || !isValidDate(parseDate(date))) return []
			return [{ id: String(item.id ?? newId()), name, date }]
		}),
		events: asArray(source.events).flatMap((entry) => {
			const item = asRecord(entry)
			const name = String(item.name ?? '').trim()
			const date = String(item.date ?? '')
			if (!name || !isValidDate(parseDate(date))) return []
			return [
				{
					id: String(item.id ?? newId()),
					name,
					date,
					duration: clamp(Number(item.duration) || 1, 1, 365),
				},
			]
		}),
		chores: asArray(source.chores).flatMap((entry) => {
			const item = asRecord(entry)
			const name = String(item.name ?? '').trim()
			const date = String(item.startDate ?? '')
			if (!name || !isValidDate(parseDate(date))) return []
			return [
				{
					id: String(item.id ?? newId()),
					name,
					startDate: date,
					frequency: isChoreFrequency(item.frequency) ? item.frequency : 'weekly',
					people: asArray(item.people)
						.map((person) => String(person ?? '').trim())
						.filter(Boolean),
				},
			]
		}),
		photos: asArray(source.photos).flatMap((entry) => {
			const item = asRecord(entry)
			const path = String(item.path ?? '')
			if (!path) return []
			return [
				{
					id: String(item.id ?? newId()),
					path,
					name: String(item.name ?? path.split(/[\\/]/).pop() ?? path),
					fit: item.fit === 'contain' ? 'contain' : 'cover',
					autoRotate: item.autoRotate !== false,
					dither: item.dither !== false,
				},
			]
		}),
		exportSettings: { ...base.exportSettings, ...asRecord(source.exportSettings) },
	}
}

function asRecord(value: unknown): Record<string, never> {
	return (typeof value === 'object' && value !== null ? value : {}) as Record<string, never>
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : []
}

/** A number from a hand-edited file, or the default — `0` survives, `"x"` does not. */
function finite(value: unknown, fallback: number): number {
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value: number, low: number, high: number): number {
	return Math.min(high, Math.max(low, Math.round(value)))
}
