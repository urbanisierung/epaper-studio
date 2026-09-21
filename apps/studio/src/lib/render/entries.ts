import { daysBetween, nextOccurrence, parseDate, startOfDay } from '../date'
import type { Birthday, Project, SpecialEvent } from '../types'
import { formatDayCount, formatFullDate, formatToday } from './locale'

/** One line of the event list on a page. */
export interface DayEntry {
	name: string
	subtitle: string
	/** Drawn in the accent colour, and turns the day tile red. */
	highlighted: boolean
	/** When it happens, used for ordering. */
	at: Date
}

/**
 * What a given page lists, in the order it is drawn.
 *
 * Birthdays falling on the page's own date come first and are highlighted;
 * then upcoming birthdays and events, nearest first, until `maxEvents` lines
 * are used up.
 */
export function entriesFor(project: Project, day: Date): DayEntry[] {
	const { settings, birthdays, events } = project
	const today = startOfDay(day)
	const locale = settings.locale

	const todays: DayEntry[] = []
	const upcoming: DayEntry[] = []

	for (const birthday of birthdays) {
		const born = parseDate(birthday.date)
		if (Number.isNaN(born.getTime())) continue

		const next = nextOccurrence(born, today)
		const distance = daysBetween(today, next)
		const age = next.getFullYear() - born.getFullYear()
		const subtitle = settings.showAges
			? `${formatFullDate(locale, born)} - ${age}`
			: formatFullDate(locale, born)

		if (distance === 0) {
			todays.push({ name: birthday.name, subtitle, highlighted: true, at: next })
		} else if (distance <= settings.lookaheadDays) {
			upcoming.push({ name: birthday.name, subtitle, highlighted: false, at: next })
		}
	}

	for (const event of events) {
		const start = startOfDay(parseDate(event.date))
		if (Number.isNaN(start.getTime())) continue

		const distance = daysBetween(today, start)
		if (distance < 0) continue // already over

		if (distance === 0) {
			todays.push({
				name: event.name,
				subtitle: formatToday(locale),
				highlighted: true,
				at: start,
			})
		} else {
			upcoming.push({
				name: event.name,
				subtitle: formatDayCount(locale, distance),
				highlighted: false,
				at: start,
			})
		}
	}

	todays.sort(byDate)
	upcoming.sort(byDate)

	const slots = Math.max(0, settings.maxEvents - todays.length)
	return [...todays, ...upcoming.slice(0, slots)]
}

/** Whether the page's own day has something on it, which reddens the tile. */
export function hasEventOn(project: Project, day: Date): boolean {
	return entriesFor(project, day).some((entry) => entry.highlighted)
}

function byDate(a: DayEntry, b: DayEntry): number {
	return a.at.getTime() - b.at.getTime()
}

/** Convenience for the UI lists, not used while drawing. */
export function sortByCalendarDate<T extends Birthday | SpecialEvent>(items: T[]): T[] {
	return [...items].sort((a, b) => {
		const left = parseDate(a.date)
		const right = parseDate(b.date)
		const monthDay = (date: Date) => date.getMonth() * 100 + date.getDate()
		return monthDay(left) - monthDay(right)
	})
}
