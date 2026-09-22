import { parseDate, startOfDay } from '../date'
import { isLanguage, type Translate, translator } from '../i18n'
import { PALETTE, type Project } from '../types'
import { type DayEntry, entriesFor } from './entries'
import { normaliseLocale } from './locale'

/** One upcoming line on a panel: everything the five designs print about it. */
export interface PanelEntry {
	name: string
	kind: 'birthday' | 'event'
	/** The age being reached, or null for a holiday or when ages are hidden. */
	age: number | null
	/** The date of birth, for the designs that print it. Null for a holiday. */
	born: Date | null
	/** Days from the page's own date; 0 means it happens on this page. */
	days: number
	at: Date
}

/** Somebody whose birthday is the page's own day. */
export interface Celebrant {
	name: string
	age: number | null
	born: Date | null
}

/**
 * Everything a page design draws, worked out once so the templates only lay
 * things out.
 */
export interface Panel {
	day: Date
	accent: string
	/** The display face; labels and countdowns use {@link MONO} instead. */
	font: string
	locale: string
	weekStartsOn: 0 | 1
	/** Bound to the *calendar* language, so the page reads in its own language. */
	t: Translate
	/** Non-empty puts the design into its birthday state (brief §4). */
	celebrants: Celebrant[]
	upcoming: PanelEntry[]
	/** Days of the page's own month that carry an event, for the month grid. */
	marks: number[]
}

export function buildPanel(project: Project, day: Date): Panel {
	const { settings } = project
	const entries = entriesFor(project, day)

	return {
		day,
		accent: PALETTE[settings.accentColor],
		font: settings.fontFamily,
		locale: settings.locale,
		weekStartsOn: settings.weekStartsOn,
		t: translator(pageLanguage(settings.locale)),
		celebrants: entries
			.filter((entry) => entry.kind === 'birthday' && entry.days === 0)
			.map((entry) => ({ name: entry.name, age: entry.age, born: entry.born })),
		// The celebrants are no longer upcoming, so they drop out of the list.
		upcoming: entries.filter(isUpcoming).map(toPanelEntry),
		marks: marksFor(project, day),
	}
}

/**
 * The language the page itself is printed in.
 *
 * The app ships two catalogues; a calendar set to a third language keeps its
 * `Intl` weekday and month names and takes English labels.
 */
function pageLanguage(locale: string) {
	const primary = normaliseLocale(locale).split('-')[0].toLowerCase()
	return isLanguage(primary) ? primary : 'en'
}

function isUpcoming(entry: DayEntry): boolean {
	return !(entry.kind === 'birthday' && entry.days === 0)
}

function toPanelEntry(entry: DayEntry): PanelEntry {
	return {
		name: entry.name,
		kind: entry.kind,
		age: entry.age,
		born: entry.born,
		days: entry.days,
		at: entry.at,
	}
}

/** Which days of the shown month have something on them. */
function marksFor(project: Project, day: Date): number[] {
	const month = day.getMonth()
	const year = day.getFullYear()
	const days = new Set<number>()

	for (const birthday of project.birthdays) {
		const born = parseDate(birthday.date)
		if (Number.isNaN(born.getTime())) continue
		if (born.getMonth() === month) days.add(born.getDate())
	}

	for (const event of project.events) {
		const start = startOfDay(parseDate(event.date))
		if (Number.isNaN(start.getTime())) continue
		const length = Math.max(1, Math.floor(event.duration))
		for (let offset = 0; offset < length; offset++) {
			const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset)
			if (date.getFullYear() === year && date.getMonth() === month) days.add(date.getDate())
		}
	}

	return [...days].sort((a, b) => a - b)
}

/** `in 8 d`, or `today` for something happening on the page's own day. */
export function countdown(panel: Panel, entry: PanelEntry): string {
	return entry.days === 0 ? panel.t('page.onTheDay') : panel.t('page.inDays', { count: entry.days })
}

/** `turns 40` / `Birthday` / `Holiday` — the line under an entry's name. */
export function entryKindLabel(panel: Panel, entry: PanelEntry): string {
	if (entry.kind === 'event') return panel.t('page.holiday')
	return entry.age === null ? panel.t('page.birthday') : panel.t('page.turns', { age: entry.age })
}
