import { daysBetween, parseDate, startOfDay } from '../date'
import type { Chore, Project } from '../types'

/** A chore due on a page, and whose turn it is. */
export interface ChoreDuty {
	id: string
	name: string
	/** The person in the rotation, or null when the chore names nobody. */
	person: string | null
}

const STEP_DAYS: Record<'daily' | 'weekly' | 'fortnightly', number> = {
	daily: 1,
	weekly: 7,
	fortnightly: 14,
}

/**
 * Which turn `day` is, counting from the chore's first day, or null when the
 * chore is not due that day.
 *
 * The count is what drives the rotation, so it has to be the number of times
 * the chore has come round rather than the number of days elapsed.
 */
export function occurrenceIndex(chore: Chore, day: Date): number | null {
	const anchor = startOfDay(parseDate(chore.startDate))
	if (Number.isNaN(anchor.getTime())) return null

	const today = startOfDay(day)

	if (chore.frequency === 'monthly') {
		const months =
			(today.getFullYear() - anchor.getFullYear()) * 12 + (today.getMonth() - anchor.getMonth())
		if (months < 0) return null
		// A chore anchored on the 31st still happens in February; it lands on
		// the last day the month has.
		const daysThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
		const dueDay = Math.min(anchor.getDate(), daysThisMonth)
		return today.getDate() === dueDay ? months : null
	}

	const elapsed = daysBetween(anchor, today)
	if (elapsed < 0) return null
	const step = STEP_DAYS[chore.frequency]
	return elapsed % step === 0 ? elapsed / step : null
}

export function isDueOn(chore: Chore, day: Date): boolean {
	return occurrenceIndex(chore, day) !== null
}

/** Whose turn it is on `day`, or null if the chore is not due or names nobody. */
export function personFor(chore: Chore, day: Date): string | null {
	const index = occurrenceIndex(chore, day)
	if (index === null) return null
	const people = chore.people.filter((person) => person.trim() !== '')
	if (people.length === 0) return null
	return people[index % people.length]
}

/**
 * The chores a page lists, in the order they were added, capped by the
 * `maxChores` setting so a long list cannot push the month grid off the page.
 */
export function choresFor(project: Project, day: Date): ChoreDuty[] {
	const limit = Math.max(0, project.settings.maxChores)
	if (limit === 0) return []

	const due: ChoreDuty[] = []
	for (const chore of project.chores) {
		if (due.length >= limit) break
		if (!isDueOn(chore, day)) continue
		due.push({ id: chore.id, name: chore.name, person: personFor(chore, day) })
	}
	return due
}
