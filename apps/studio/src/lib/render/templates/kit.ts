import { drawText, MONO, type TextOptions } from '../draw'
import {
	formatDayMonthNumeric,
	formatFullDate,
	monthShort,
	weekdayLong,
	weekdayShort,
} from '../locale'
import type { Panel } from '../panel'
import { type Celebrant, countdown, entryKindLabel, type PanelEntry } from '../panel'

export { countdown, entryKindLabel }

/** The page is 480 x 800 design units; every template lays out in those. */
export const DESIGN_WIDTH = 480
export const DESIGN_HEIGHT = 800

/**
 * A tracked uppercase mono label — the kicker, column heads and countdowns
 * that run through all five designs.
 */
export function monoLabel(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	options: Omit<TextOptions, 'font'> & { upper?: boolean },
): void {
	drawText(ctx, {
		...options,
		text: options.upper === false ? options.text : options.text.toLocaleUpperCase(panel.locale),
		font: MONO,
		weight: options.weight ?? 600,
	})
}

/** `29 SEP`, the two-line date stamp on a list row. */
export function stampMonth(panel: Panel, date: Date): string {
	return monthShort(panel.locale, date).toLocaleUpperCase(panel.locale).replace('.', '')
}

export function stampDay(date: Date): string {
	return String(date.getDate()).padStart(2, '0')
}

/** `29.09.` / `29/09` — the ledger's date column. */
export function stampNumeric(panel: Panel, date: Date): string {
	return formatDayMonthNumeric(panel.locale, date)
}

/** `Tue 29 Sep · birthday`, the agenda's mono line under a name. */
export function entryDateLine(panel: Panel, entry: PanelEntry): string {
	const weekday = weekdayShort(panel.locale, entry.at).replace('.', '')
	return `${weekday} ${stampDay(entry.at)} ${stampMonth(panel, entry.at)} · ${entryKindLabel(panel, entry)}`
}

export function weekdayName(panel: Panel): string {
	return weekdayLong(panel.locale, panel.day)
}

/**
 * The celebrants beyond the first, as one line.
 *
 * The brief wants a second birthday repeated inside the same accent block
 * rather than a second block, and a panel that fits three names is not a panel
 * that fits three 56 px names — so the rest set small on one line.
 */
export function extraCelebrants(panel: Panel): string | null {
	const rest = panel.celebrants.slice(1)
	if (rest.length === 0) return null
	return rest
		.map((person) => (person.age === null ? person.name : `${person.name} ${person.age}`))
		.join(' · ')
}

/**
 * `born 29 Sep 1986` — the line 1b sets under the name, and null when the
 * birthday was imported without a year of birth to print.
 */
export function bornLine(panel: Panel, celebrant: Celebrant): string | null {
	if (!celebrant.born) return null
	return panel.t('page.born', { date: formatFullDate(panel.locale, celebrant.born) })
}

/** `born 1986 · 40 years`, the poster's line under the name. */
export function bornYearsLine(panel: Panel, celebrant: Celebrant): string | null {
	if (!celebrant.born || celebrant.age === null) return null
	return panel.t('page.bornYears', {
		year: celebrant.born.getFullYear(),
		count: celebrant.age,
	})
}

/** `turns 40`, or just `Birthday` when ages are switched off. */
export function celebrantAgeLine(panel: Panel, celebrant: Celebrant): string {
	return celebrant.age === null
		? panel.t('page.birthdayToday')
		: panel.t('page.turns', { age: celebrant.age })
}
