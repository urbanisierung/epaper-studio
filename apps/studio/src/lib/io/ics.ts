import { formatDate } from '../date'
import { newId } from '../defaults'
import type { Birthday, SpecialEvent } from '../types'

export interface IcsImport {
	birthdays: Birthday[]
	events: SpecialEvent[]
}

/**
 * Reads an `.ics` export from a phone or calendar app.
 *
 * Yearly-repeating all-day events are treated as birthdays (that is how every
 * contacts app writes them); everything else becomes a dated event whose
 * duration comes from `DTEND`, which iCalendar defines as exclusive for
 * all-day events.
 */
export function parseIcs(text: string): IcsImport {
	const birthdays: Birthday[] = []
	const events: SpecialEvent[] = []

	for (const block of eventBlocks(unfold(text))) {
		const summary = decodeText(block.get('SUMMARY') ?? '')
		const start = parseIcsDate(block.get('DTSTART'))
		if (!summary || !start) continue

		if ((block.get('RRULE') ?? '').toUpperCase().includes('FREQ=YEARLY')) {
			birthdays.push({ id: newId(), name: summary, date: formatDate(start) })
			continue
		}

		const end = parseIcsDate(block.get('DTEND'))
		const duration = end
			? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000))
			: 1
		events.push({ id: newId(), name: summary, date: formatDate(start), duration })
	}

	return { birthdays, events }
}

/** iCalendar wraps long lines; a leading space or tab continues the one above. */
function unfold(text: string): string[] {
	const lines: string[] = []
	for (const raw of text.split(/\r?\n/)) {
		if ((raw.startsWith(' ') || raw.startsWith('\t')) && lines.length > 0) {
			lines[lines.length - 1] += raw.slice(1)
		} else {
			lines.push(raw)
		}
	}
	return lines
}

/** Each VEVENT as a map of property name to value, parameters stripped. */
function eventBlocks(lines: string[]): Map<string, string>[] {
	const blocks: Map<string, string>[] = []
	let current: Map<string, string> | null = null

	for (const line of lines) {
		if (line.startsWith('BEGIN:VEVENT')) {
			current = new Map()
		} else if (line.startsWith('END:VEVENT')) {
			if (current) blocks.push(current)
			current = null
		} else if (current) {
			const separator = line.indexOf(':')
			if (separator < 0) continue
			// `DTSTART;VALUE=DATE` -> `DTSTART`
			const name = line.slice(0, separator).split(';')[0].toUpperCase()
			if (!current.has(name)) current.set(name, line.slice(separator + 1))
		}
	}
	return blocks
}

/** `20260716` or `20260716T090000Z` -> a local date. */
function parseIcsDate(value: string | undefined): Date | null {
	if (!value) return null
	const match = /^(\d{4})(\d{2})(\d{2})/.exec(value.trim())
	if (!match) return null
	const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
	return Number.isNaN(date.getTime()) ? null : date
}

function decodeText(value: string): string {
	return value
		.replace(/\\n/gi, ' ')
		.replace(/\\([,;\\])/g, '$1')
		.trim()
}
