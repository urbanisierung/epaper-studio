import { dayOfYear, daysInYear } from '../../date'
import { drawText, fillRect, INK, measureText, strokeRect } from '../draw'
import { monthLong, monthShort, weekdayShort } from '../locale'
import type { Panel, PanelEntry } from '../panel'
import { bornLine, countdown, extraCelebrants, monoLabel, stampNumeric } from './kit'
import { drawMonthGrid, monthGridHeight, monthGridRows } from './monthGrid'

const X = 26
const RIGHT = 454
const WIDTH = RIGHT - X
const ROW_HEIGHT = 50

/**
 * 1b Ledger — the day as an outlined numeral over a ruled table of entries.
 *
 * Square bullets say what an entry is: filled for a birthday, outlined for a
 * holiday. On a birthday the numeral outlines in the accent and an
 * accent-ruled band carries the name and the new age.
 */
export function drawLedger(ctx: CanvasRenderingContext2D, panel: Panel): void {
	drawMasthead(ctx, panel)

	const tableTop = panel.celebrants.length
		? drawBirthdayBand(ctx, panel)
		: drawDateBlock(ctx, panel)

	const gridTop = 776 - monthGridHeight(monthGridRows(panel))
	const bandTop = gridTop - 19 // the double rule and its 16 px of air
	const rows = Math.max(0, Math.floor((bandTop - tableTop) / ROW_HEIGHT))
	drawTable(ctx, panel, tableTop, panel.upcoming.slice(0, rows))

	doubleRule(ctx, bandTop)
	drawMonthGrid(ctx, panel, { x: X, y: gridTop, width: WIDTH, variant: 'dot' })
}

function drawMasthead(ctx: CanvasRenderingContext2D, panel: Panel): void {
	monoLabel(ctx, panel, {
		text: `${monthLong(panel.locale, panel.day.getFullYear(), panel.day.getMonth())} ${panel.day.getFullYear()}`,
		x: X,
		y: 38,
		size: 14,
		color: INK,
		tracking: 0.16,
		maxWidth: WIDTH * 0.6,
	})
	monoLabel(ctx, panel, {
		text: panel.t('page.dayOfYear', {
			day: dayOfYear(panel.day),
			total: daysInYear(panel.day.getFullYear()),
		}),
		x: RIGHT,
		y: 38,
		size: 14,
		color: panel.accent,
		tracking: 0.16,
		align: 'right',
	})
	doubleRule(ctx, 48)
}

/** The ordinary day block: hollow numeral beside a stacked mono date. */
function drawDateBlock(ctx: CanvasRenderingContext2D, panel: Panel): number {
	numeral(ctx, panel, 172, INK)
	stackedDate(ctx, panel, 100)
	return tableHead(ctx, panel, 206, true)
}

/** The birthday state: accent numeral, then an accent-ruled name band. */
function drawBirthdayBand(ctx: CanvasRenderingContext2D, panel: Panel): number {
	const celebrant = panel.celebrants[0]
	const extras = extraCelebrants(panel)

	numeral(ctx, panel, 168, panel.accent)
	stackedDate(ctx, panel, 96)

	fillRect(ctx, X, 194, WIDTH, 2, panel.accent)
	monoLabel(ctx, panel, {
		text: panel.t('page.birthdayToday'),
		x: X,
		y: 223,
		size: 13,
		color: panel.accent,
		tracking: 0.18,
	})

	const name = celebrant.name
	drawText(ctx, {
		text: name,
		x: X,
		y: 262,
		size: 40,
		font: panel.font,
		color: INK,
		weight: 900,
		tracking: -0.02,
		maxWidth: WIDTH - 90,
	})
	if (celebrant.age !== null) {
		drawText(ctx, {
			text: String(celebrant.age),
			x:
				X +
				Math.min(
					measureText(ctx, { text: name, size: 40, font: panel.font, weight: 900 }),
					WIDTH - 90,
				) +
				12,
			y: 262,
			size: 40,
			font: panel.font,
			color: panel.accent,
			weight: 900,
			tracking: -0.02,
		})
	}
	drawText(ctx, {
		text: extras ?? bornLine(panel, celebrant) ?? panel.t('page.birthdayToday'),
		x: X,
		y: 284,
		size: 16,
		font: panel.font,
		color: INK,
		weight: 600,
		maxWidth: WIDTH,
	})
	fillRect(ctx, X, 294, WIDTH, 2, panel.accent)

	return tableHead(ctx, panel, 318, false)
}

function numeral(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	baseline: number,
	color: string,
): void {
	drawText(ctx, {
		text: String(panel.day.getDate()).padStart(2, '0'),
		x: X + 2,
		y: baseline,
		size: 132,
		font: panel.font,
		color,
		weight: 900,
		tracking: -0.06,
		strokeWidth: 3,
	})
}

/** `Mon / — / Sep / 2026`, set beside the numeral. */
function stackedDate(ctx: CanvasRenderingContext2D, panel: Panel, top: number): void {
	const x =
		X +
		2 +
		measureText(ctx, { text: '00', size: 132, font: panel.font, weight: 900, tracking: -0.06 }) +
		18
	const line = (text: string, y: number) =>
		monoLabel(ctx, panel, { text, x, y, size: 16, color: INK, weight: 700, tracking: 0.14 })

	line(weekdayShort(panel.locale, panel.day).replace('.', ''), top)
	fillRect(ctx, x, top + 10, 34, 2, panel.accent)
	line(monthShort(panel.locale, panel.day).replace('.', ''), top + 34)
	line(String(panel.day.getFullYear()), top + 56)
}

/** Date / Entry / Left. Returns the top of the first row. */
function tableHead(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	top: number,
	ruleAbove: boolean,
): number {
	if (ruleAbove) fillRect(ctx, X, top, WIDTH, 1, INK)
	const baseline = top + 19
	monoLabel(ctx, panel, {
		text: panel.t('page.column.date'),
		x: X,
		y: baseline,
		size: 13,
		color: INK,
		tracking: 0.18,
	})
	monoLabel(ctx, panel, {
		text: panel.t('page.column.entry'),
		x: X + 66,
		y: baseline,
		size: 13,
		color: INK,
		tracking: 0.18,
	})
	monoLabel(ctx, panel, {
		text: panel.t('page.column.left'),
		x: RIGHT,
		y: baseline,
		size: 13,
		color: INK,
		tracking: 0.18,
		align: 'right',
	})
	fillRect(ctx, X, baseline + 10, WIDTH, 1, INK)
	return baseline + 11
}

function drawTable(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	top: number,
	entries: PanelEntry[],
): void {
	entries.forEach((entry, index) => {
		const rowTop = top + index * ROW_HEIGHT
		const baseline = rowTop + 30

		monoLabel(ctx, panel, {
			text: stampNumeric(panel, entry.at),
			x: X,
			y: baseline,
			size: 15,
			color: INK,
			weight: 700,
		})

		const bulletY = baseline - 15
		if (entry.kind === 'birthday') fillRect(ctx, X + 66, bulletY, 9, 9, panel.accent)
		else strokeRect(ctx, X + 66, bulletY, 9, 9, INK, 1.5)

		const days = countdown(panel, entry)
		const daysWidth = measureText(ctx, { text: days, size: 15, font: panel.font, weight: 700 })
		monoLabel(ctx, panel, {
			text: days,
			x: RIGHT,
			y: baseline,
			size: 15,
			color: INK,
			weight: 700,
			align: 'right',
			upper: false,
		})

		const nameX = X + 84
		drawText(ctx, {
			text: entry.age === null ? entry.name : `${entry.name} · ${entry.age}`,
			x: nameX,
			y: baseline,
			size: 19,
			font: panel.font,
			color: INK,
			weight: 700,
			maxWidth: RIGHT - nameX - daysWidth - 14,
		})

		fillRect(ctx, X, rowTop + ROW_HEIGHT - 1, WIDTH, 1, INK)
	})
}

/** The `3px double` masthead rule, as two hairlines. */
function doubleRule(ctx: CanvasRenderingContext2D, y: number): void {
	fillRect(ctx, X, y, WIDTH, 1, INK)
	fillRect(ctx, X, y + 3, WIDTH, 1, INK)
}
