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
