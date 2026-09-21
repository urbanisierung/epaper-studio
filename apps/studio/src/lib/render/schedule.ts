import { DAY, parseDate, startOfDay } from '../date'
import type { Project, SpecialEvent } from '../types'

export interface ScheduledPage {
	date: Date
	/** `YYYYMMDD.bmp`, the name the device shows in date order. */
	fileName: string
}

/**
 * Which days get a page.
 *
 * Walks `numberOfDays` calendar days from the start date. Days that fall
 * *inside* a multi-day event are skipped, so a nine-day trip produces one page
 * rather than nine — the behaviour of the original script, kept because it is
 * what makes a holiday read as a single entry on the display.
 */
export function buildSchedule(project: Project): ScheduledPage[] {
	const { settings, events } = project
	const start = startOfDay(parseDate(settings.startDate))
	const skipped = collapsedDays(events, settings.collapseMultiDayEvents)

	const pages: ScheduledPage[] = []
	for (let offset = 0; offset < settings.numberOfDays; offset++) {
		const date = new Date(start.getTime() + offset * DAY)
		if (skipped.has(startOfDay(date).getTime())) continue
		pages.push({ date, fileName: `${pageStem(date)}.bmp` })
	}
	return pages
}

/** The days an event swallows: everything after its first day. */
function collapsedDays(events: SpecialEvent[], collapse: boolean): Set<number> {
	const skipped = new Set<number>()
	if (!collapse) return skipped
	for (const event of events) {
		const duration = Math.max(1, Math.floor(event.duration))
		const first = startOfDay(parseDate(event.date))
		for (let offset = 1; offset < duration; offset++) {
			skipped.add(first.getTime() + offset * DAY)
		}
	}
	return skipped
}

export function pageStem(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}${month}${day}`
}
