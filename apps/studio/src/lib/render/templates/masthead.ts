import { isoWeek } from '../../date'
import { drawText, fillRect, INK, measureText, WHITE } from '../draw'
import { monthLong } from '../locale'
import type { Panel, PanelEntry } from '../panel'
import {
	celebrantAgeLine,
	countdown,
	entryKindLabel,
	extraCelebrants,
	monoLabel,
	stampDay,
	stampMonth,
	weekdayName,
} from './kit'
import { drawMonthGrid, monthGridHeight, monthGridRows } from './monthGrid'

/**
 * 1a Masthead — the date leads, events follow as a ruled list.
 *
 * On a birthday the masthead itself is replaced by a solid accent block, and
 * the date numeral drops from 150 px to 80 px so the name stays the largest
 * thing on the page.
 */
export function drawMasthead(ctx: CanvasRenderingContext2D, panel: Panel): void {
	const x = 28
	const right = 452
	const width = right - x

	monoLabel(ctx, panel, {
		text: panel.t('page.week', { count: isoWeek(panel.day) }),
		x,
		y: 40,
		size: 14,
		color: INK,
		tracking: 0.1,
	})
	monoLabel(ctx, panel, {
		text: String(panel.day.getFullYear()),
		x: right,
		y: 40,
		size: 14,
		color: INK,
		tracking: 0.1,
		align: 'right',
	})
	fillRect(ctx, x, 56, width, 4, panel.accent)

	const listTop = panel.celebrants.length
		? drawBirthdayHead(ctx, panel, x, width)
		: drawDateHead(ctx, panel, x, width)

	const gridTop = 774 - monthGridHeight(monthGridRows(panel))
	const rows = Math.max(0, Math.floor((gridTop - listTop) / ROW_HEIGHT))
	drawList(ctx, panel, x, right, listTop, panel.upcoming.slice(0, rows))

	drawMonthGrid(ctx, panel, { x, y: gridTop, width, variant: 'ring' })
}

const ROW_HEIGHT = 66

/** The ordinary masthead: weekday, then the day in 150 px. */
function drawDateHead(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	x: number,
	width: number,
): number {
	drawText(ctx, {
		text: weekdayName(panel),
		x,
		y: 100,
		size: 30,
		font: panel.font,
		color: INK,
		weight: 700,
		maxWidth: width,
	})

	const numeral = String(panel.day.getDate())
	drawText(ctx, {
		text: numeral,
		x,
		y: 226,
		size: 150,
		font: panel.font,
		color: INK,
		weight: 900,
		tracking: -0.06,
	})
	drawText(ctx, {
		text: monthLong(panel.locale, panel.day.getFullYear(), panel.day.getMonth()),
		x: x + measureText(ctx, { text: numeral, size: 150, font: panel.font, weight: 900 }) + 14,
		y: 214,
		size: 22,
		font: panel.font,
		color: INK,
		weight: 700,
		maxWidth: width - 120,
	})

	return sectionHead(ctx, panel, x, width, 260)
}

/** The birthday state: an accent block where the masthead was. */
function drawBirthdayHead(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	x: number,
	width: number,
): number {
	const celebrant = panel.celebrants[0]
	const extras = extraCelebrants(panel)

	fillRect(ctx, x, 78, width, 160, panel.accent)
	monoLabel(ctx, panel, {
		text: panel.t('page.birthdayToday'),
		x: x + 22,
		y: 111,
		size: 14,
		color: WHITE,
		tracking: 0.2,
	})
	drawText(ctx, {
		text: celebrant.name,
		x: x + 22,
		y: 180,
		size: 56,
		font: panel.font,
		color: WHITE,
		weight: 900,
		tracking: -0.03,
		maxWidth: width - 44,
	})
	drawText(ctx, {
		text: celebrantAgeLine(panel, celebrant),
		x: x + 22,
		y: 212,
		size: 26,
		font: panel.font,
		color: WHITE,
		weight: 700,
		maxWidth: width - 44,
	})
	if (extras) {
		monoLabel(ctx, panel, {
			text: extras,
			x: x + 22,
			y: 231,
			size: 14,
			color: WHITE,
			tracking: 0.1,
			maxWidth: width - 44,
		})
	}

	// The date is still here, just no longer the headline.
	const numeral = String(panel.day.getDate())
	drawText(ctx, {
		text: numeral,
		x,
		y: 314,
		size: 80,
		font: panel.font,
		color: INK,
		weight: 900,
		tracking: -0.05,
	})
	drawText(ctx, {
		text: `${weekdayName(panel)}, ${monthLong(panel.locale, panel.day.getFullYear(), panel.day.getMonth())}`,
		x: x + measureText(ctx, { text: numeral, size: 80, font: panel.font, weight: 900 }) + 12,
		y: 306,
		size: 20,
		font: panel.font,
		color: INK,
		weight: 700,
		maxWidth: width - 90,
	})

	return sectionHead(ctx, panel, x, width, 344)
}

/** Hairline, then the "Coming up" kicker. Returns the top of the list. */
function sectionHead(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	x: number,
	width: number,
	ruleY: number,
): number {
	fillRect(ctx, x, ruleY, width, 1, INK)
	monoLabel(ctx, panel, {
		text: panel.t('page.comingUp'),
		x,
		y: ruleY + 28,
		size: 14,
		color: INK,
		tracking: 0.14,
	})
	return ruleY + 44
}

function drawList(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	x: number,
	right: number,
	top: number,
	entries: PanelEntry[],
): void {
	entries.forEach((entry, index) => {
		const rowTop = top + index * ROW_HEIGHT
		fillRect(ctx, x, rowTop, right - x, 1, INK)

		monoLabel(ctx, panel, {
			text: stampDay(entry.at),
			x,
			y: rowTop + 25,
			size: 15,
			color: INK,
			weight: 700,
		})
		monoLabel(ctx, panel, {
			text: stampMonth(panel, entry.at),
			x,
			y: rowTop + 44,
			size: 15,
			color: INK,
			weight: 700,
		})

		const days = countdown(panel, entry)
		const daysWidth = measureText(ctx, { text: days, size: 16, font: panel.font, weight: 700 })
		drawText(ctx, {
			text: days,
			x: right,
			y: rowTop + 39,
			size: 16,
			font: panel.font,
			color: entry.kind === 'birthday' ? panel.accent : INK,
			weight: 700,
			align: 'right',
		})

		const nameX = x + 56
		const nameWidth = right - nameX - daysWidth - 14
		drawText(ctx, {
			text: entry.name,
			x: nameX,
			y: rowTop + 31,
			size: 20,
			font: panel.font,
			color: INK,
			weight: 700,
			maxWidth: nameWidth,
		})
		drawText(ctx, {
			text: entryKindLabel(panel, entry),
			x: nameX,
			y: rowTop + 52,
			size: 16,
			font: panel.font,
			color: INK,
			weight: 600,
			maxWidth: nameWidth,
		})
	})

	if (entries.length > 0) {
		fillRect(ctx, x, top + entries.length * ROW_HEIGHT, right - x, 1, INK)
	}
}
