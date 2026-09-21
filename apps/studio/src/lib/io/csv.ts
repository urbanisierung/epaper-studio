import type { Birthday, SpecialEvent } from '../types'

/**
 * A spreadsheet-friendly exchange format, so a list of birthdays can be built
 * in Excel or Numbers and dropped into the app.
 *
 * These write one list on its own — `name,date` for birthdays, and
 * `name,date,duration` for events. `calendarData.ts` writes the combined table
 * that carries both, and does all the reading, using the row splitter below.
 */

export function birthdaysToCsv(birthdays: Birthday[]): string {
	return toCsv(
		['name', 'date'],
		birthdays.map((birthday) => [birthday.name, birthday.date]),
	)
}

export function eventsToCsv(events: SpecialEvent[]): string {
	return toCsv(
		['name', 'date', 'duration'],
		events.map((event) => [event.name, event.date, String(event.duration)]),
	)
}

/**
 * Rows keyed by column name. A header row is used when present; otherwise the
 * columns are assumed to be name, date, duration in that order.
 */
export function rowsOf(text: string): Record<string, string>[] {
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
	if (lines.length === 0) return []

	const firstCells = splitRow(lines[0]).map((cell) => cell.toLowerCase())
	const hasHeader = firstCells.includes('name') && firstCells.includes('date')
	const columns = hasHeader ? firstCells : ['name', 'date', 'duration']

	return lines.slice(hasHeader ? 1 : 0).map((line) => {
		const cells = splitRow(line)
		return Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? '']))
	})
}

function splitRow(line: string): string[] {
	const cells: string[] = []
	let current = ''
	let quoted = false

	for (let index = 0; index < line.length; index++) {
		const character = line[index]
		if (quoted) {
			if (character === '"') {
				if (line[index + 1] === '"') {
					current += '"'
					index++
				} else {
					quoted = false
				}
			} else {
				current += character
			}
		} else if (character === '"') {
			quoted = true
		} else if (character === ',' || character === ';') {
			cells.push(current.trim())
			current = ''
		} else {
			current += character
		}
	}
	cells.push(current.trim())
	return cells
}

export function toCsv(header: string[], rows: string[][]): string {
	return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
}

function escapeCell(value: string): string {
	return /[",;\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}
