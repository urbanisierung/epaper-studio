export const DAY = 86_400_000

/**
 * Parses `YYYY-MM-DD` as a local date.
 *
 * `new Date('2026-07-16')` is parsed as UTC midnight, which lands on the
 * previous day west of Greenwich and shifts every page by one. Splitting the
 * string avoids that.
 */
export function parseDate(value: string): Date {
	const [year, month, day] = value.split('-').map(Number)
	if (!year || !month || !day) return new Date(NaN)
	return new Date(year, month - 1, day)
}

export function formatDate(date: Date): string {
	const year = String(date.getFullYear()).padStart(4, '0')
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isValidDate(date: Date): boolean {
	return !Number.isNaN(date.getTime())
}

export function addDays(date: Date, days: number): Date {
	const result = new Date(date)
	result.setDate(result.getDate() + days)
	return result
}

/** Same day and month, in the first year where it has not happened yet. */
export function nextOccurrence(anniversary: Date, from: Date): Date {
	const candidate = new Date(from.getFullYear(), anniversary.getMonth(), anniversary.getDate())
	if (candidate.getTime() < startOfDay(from).getTime()) {
		candidate.setFullYear(from.getFullYear() + 1)
	}
	return candidate
}

export function daysBetween(from: Date, to: Date): number {
	return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY)
}

/**
 * ISO-8601 week number: weeks run Monday to Sunday, and week 1 is the one
 * holding the first Thursday of the year.
 */
export function isoWeek(date: Date): number {
	const thursday = startOfDay(date)
	// Shift to the Thursday of this week, which always sits in the owning year.
	thursday.setDate(thursday.getDate() + 3 - ((thursday.getDay() + 6) % 7))
	const firstThursday = new Date(thursday.getFullYear(), 0, 4)
	firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7))
	return 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * DAY))
}

/** 1 on 1 January. */
export function dayOfYear(date: Date): number {
	return daysBetween(new Date(date.getFullYear(), 0, 1), date) + 1
}

export function daysInYear(year: number): number {
	return daysBetween(new Date(year, 0, 1), new Date(year + 1, 0, 1))
}

/** Weeks of a month as day numbers, 0 for cells outside the month. */
export function weeksOf(year: number, monthIndex: number, weekStartsOn: 0 | 1): number[][] {
	const firstWeekday = new Date(year, monthIndex, 1).getDay()
	const leading = (firstWeekday - weekStartsOn + 7) % 7
	const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

	const cells: number[] = [
		...Array(leading).fill(0),
		...Array.from({ length: daysInMonth }, (_, index) => index + 1),
	]
	while (cells.length % 7 !== 0) cells.push(0)

	const weeks: number[][] = []
	for (let index = 0; index < cells.length; index += 7) {
		weeks.push(cells.slice(index, index + 7))
	}
	return weeks
}
