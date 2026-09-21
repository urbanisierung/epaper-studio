import { addDays, formatDate, isValidDate, parseDate } from '../date'
import { newId } from '../defaults'
import { type Birthday, type Chore, isChoreFrequency, type SpecialEvent } from '../types'
import { rowsOf, toCsv } from './csv'
import { parseIcs } from './ics'

/**
 * Birthdays and holidays travel together.
 *
 * They are two lists in the app, but they are one thing to back up, hand to
 * somebody else or move to a new machine — so every format here carries both,
 * and reading a file that only holds one of them still works.
 */
export interface CalendarData {
	birthdays: Birthday[]
	events: SpecialEvent[]
	chores: Chore[]
}

/** What a typeless file should be read as when nothing in it says. */
export type DataKind = 'birthdays' | 'events' | 'chores' | 'both'

export const EMPTY_DATA: CalendarData = { birthdays: [], events: [], chores: [] }

export function countOf(data: CalendarData): number {
	return data.birthdays.length + data.events.length + data.chores.length
}

/* -------------------------------------------------------------- writing -- */

export function toCombinedJson(data: CalendarData): string {
	const document = {
		version: 1,
		birthdays: data.birthdays,
		events: data.events,
		chores: data.chores,
	}
	return `${JSON.stringify(document, null, 2)}\n`
}

/**
 * One table for both lists, with a `type` column telling them apart. A
 * birthday leaves `duration` empty, which spreadsheets and the reader below
 * both cope with.
 */
export function toCombinedCsv(data: CalendarData): string {
	return toCsv(
		['type', 'name', 'date', 'duration', 'frequency', 'people'],
		[
			...data.birthdays.map((birthday) => ['birthday', birthday.name, birthday.date, '', '', '']),
			...data.events.map((event) => [
				'event',
				event.name,
				event.date,
				String(event.duration),
				'',
				'',
			]),
			// `;` is one of the cell separators the reader accepts, so the rota
			// is joined with a pipe instead.
			...data.chores.map((chore) => [
				'chore',
				chore.name,
				chore.startDate,
				'',
				chore.frequency,
				chore.people.join('|'),
			]),
		],
	)
}

/**
 * An `.ics` calendar, which is what phones and calendar apps read.
 *
 * Birthdays become all-day events repeating yearly — the shape every contacts
 * app writes — so `parseIcs` puts them back in the right list on the way in.
 *
 * Chores are left out: iCalendar can repeat an event but has no way to say
 * whose turn it is, so a rota would come back as a nameless repeat. They go in
 * the JSON and CSV, which carry the rotation.
 */
export function toCombinedIcs(data: CalendarData, stamp = new Date()): string {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//E-Paper Studio//Calendar data//EN',
		'CALSCALE:GREGORIAN',
	]

	for (const birthday of data.birthdays) {
		const start = parseDate(birthday.date)
		lines.push(
			...vevent(birthday.id, birthday.name, start, addDays(start, 1), icsStamp(stamp), true),
		)
	}
	for (const event of data.events) {
		const start = parseDate(event.date)
		const end = addDays(start, Math.max(1, event.duration))
		lines.push(...vevent(event.id, event.name, start, end, icsStamp(stamp), false))
	}

	lines.push('END:VCALENDAR')
	return `${lines.flatMap(foldLine).join('\r\n')}\r\n`
}

function vevent(
	id: string,
	summary: string,
	start: Date,
	end: Date,
	stamp: string,
	yearly: boolean,
): string[] {
	return [
		'BEGIN:VEVENT',
		`UID:${id}@epaper-studio`,
		`DTSTAMP:${stamp}`,
		`SUMMARY:${escapeIcsText(summary)}`,
		`DTSTART;VALUE=DATE:${compactDate(start)}`,
		// iCalendar treats DTEND as exclusive for all-day events.
		`DTEND;VALUE=DATE:${compactDate(end)}`,
		...(yearly ? ['RRULE:FREQ=YEARLY'] : []),
		'TRANSP:TRANSPARENT',
		'END:VEVENT',
	]
}

function compactDate(date: Date): string {
	return formatDate(date).replace(/-/g, '')
}

function icsStamp(date: Date): string {
	return `${date.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`
}

function escapeIcsText(value: string): string {
	return value.replace(/([\\,;])/g, '\\$1').replace(/\r?\n/g, '\\n')
}

/** iCalendar lines are folded at 75 octets; a tab continues the line above. */
function foldLine(line: string): string[] {
	if (line.length <= 73) return [line]
	const parts: string[] = [line.slice(0, 73)]
	for (let index = 73; index < line.length; index += 72) {
		parts.push(` ${line.slice(index, index + 72)}`)
	}
	return parts
}

/* -------------------------------------------------------------- reading -- */

/**
 * Reads whatever the user picked.
 *
 * The format is taken from the file name where there is one to go by, and from
 * the contents where there is not. `fallback` decides which list a file without
 * any type marker lands in — a bare `name,date` CSV opened from the birthdays
 * tab is a list of birthdays.
 */
export function parseCalendarData(text: string, path: string, fallback: DataKind): CalendarData {
	const name = path.toLowerCase()
	if (name.endsWith('.ics') || /^BEGIN:VCALENDAR/im.test(text)) {
		return { ...parseIcs(text), chores: [] }
	}
	if (name.endsWith('.json') || /^\s*[[{]/.test(text)) {
		return fromJson(text, fallback)
	}
	return fromCsv(text, fallback)
}

function fromJson(text: string, fallback: DataKind): CalendarData {
	const parsed: unknown = JSON.parse(text)

	if (Array.isArray(parsed)) return fromRows(parsed as Record<string, unknown>[], fallback)

	const source = (typeof parsed === 'object' && parsed !== null ? parsed : {}) as Record<
		string,
		unknown
	>
	// Accepts a whole project file as well as a `{ birthdays, events }` export.
	const birthdays = Array.isArray(source.birthdays) ? source.birthdays : []
	const events = Array.isArray(source.events) ? source.events : []
	const chores = Array.isArray(source.chores) ? source.chores : []
	if (birthdays.length > 0 || events.length > 0 || chores.length > 0) {
		return {
			birthdays: birthdays.flatMap((entry) => toBirthday(entry as Record<string, unknown>)),
			events: events.flatMap((entry) => toEvent(entry as Record<string, unknown>)),
			chores: chores.flatMap((entry) => toChore(entry as Record<string, unknown>)),
		}
	}
	return { birthdays: [], events: [], chores: [] }
}

function fromCsv(text: string, fallback: DataKind): CalendarData {
	return fromRows(rowsOf(text) as unknown as Record<string, unknown>[], fallback)
}

/** Sorts loose rows into the two lists, by their `type` column where present. */
function fromRows(rows: Record<string, unknown>[], fallback: DataKind): CalendarData {
	const data: CalendarData = { birthdays: [], events: [], chores: [] }

	for (const row of rows) {
		const kind = kindOf(row, fallback)
		if (kind === 'birthdays') data.birthdays.push(...toBirthday(row))
		else if (kind === 'chores') data.chores.push(...toChore(row))
		else data.events.push(...toEvent(row))
	}

	return data
}

function kindOf(
	row: Record<string, unknown>,
	fallback: DataKind,
): 'birthdays' | 'events' | 'chores' {
	const marker = String(row.type ?? row.kind ?? '')
		.trim()
		.toLowerCase()
	if (marker.startsWith('birth') || marker.startsWith('geburt')) return 'birthdays'
	if (marker.startsWith('chore') || marker.startsWith('aufgabe')) return 'chores'
	if (
		marker.startsWith('event') ||
		marker.startsWith('holiday') ||
		marker.startsWith('urlaub') ||
		marker.startsWith('feiertag')
	) {
		return 'events'
	}
	return guessKind(row, fallback)
}

/**
 * With no `type` column the shape has to say. A duration of more than a day is
 * only ever an event; anything else follows the list being imported into.
 */
function guessKind(
	row: Record<string, unknown>,
	fallback: DataKind,
): 'birthdays' | 'events' | 'chores' {
	// A rota column is only ever a chore, whichever list is being imported into.
	if (row.frequency !== undefined && String(row.frequency).trim() !== '') return 'chores'
	if (fallback !== 'both') return fallback
	const duration = Number(row.duration)
	return Number.isFinite(duration) && duration > 1 ? 'events' : 'birthdays'
}

function toBirthday(row: Record<string, unknown>): Birthday[] {
	const name = String(row.name ?? '').trim()
	const date = normalisedDate(row.date)
	if (!name || !date) return []
	return [{ id: newId(), name, date }]
}

function toEvent(row: Record<string, unknown>): SpecialEvent[] {
	const name = String(row.name ?? '').trim()
	const date = normalisedDate(row.date)
	if (!name || !date) return []
	const duration = Number.parseInt(String(row.duration ?? '1'), 10)
	return [
		{ id: newId(), name, date, duration: Math.max(1, Number.isFinite(duration) ? duration : 1) },
	]
}

function toChore(row: Record<string, unknown>): Chore[] {
	const name = String(row.name ?? '').trim()
	// `startDate` in JSON, `date` in the shared CSV column.
	const date = normalisedDate(row.startDate ?? row.date)
	if (!name || !date) return []

	const frequency = String(row.frequency ?? 'weekly')
		.trim()
		.toLowerCase()
	const people = Array.isArray(row.people)
		? row.people.map((person) => String(person ?? '').trim())
		: String(row.people ?? '').split(/[|,]/)

	return [
		{
			id: newId(),
			name,
			startDate: date,
			frequency: isChoreFrequency(frequency) ? frequency : 'weekly',
			people: people.filter(Boolean),
		},
	]
}

/** `YYYY-MM-DD`, or nothing at all if the cell is not a date. */
function normalisedDate(value: unknown): string | null {
	const raw = String(value ?? '').slice(0, 10)
	const parsed = parseDate(raw)
	return isValidDate(parsed) ? formatDate(parsed) : null
}
