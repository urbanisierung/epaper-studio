import { isoWeek } from '../../date'
import { drawText, fillRect, INK, WHITE } from '../draw'
import { monthShort } from '../locale'
import type { Panel, PanelEntry } from '../panel'
import { countdown, entryDateLine, extraCelebrants, monoLabel, weekdayName } from './kit'

const X = 28
const RIGHT = 452
const WIDTH = RIGHT - X
const BOTTOM = 772

/**
 * 1e Agenda — the date and the entries, and deliberately no month grid.
 *
 * The entry rows share whatever height is left, so three entries fill the page
 * on an ordinary day and two fill what remains under a birthday block.
 */
export function drawAgenda(ctx: CanvasRenderingContext2D, panel: Panel): void {
	const listTop = panel.celebrants.length
		? drawBirthdayBlock(ctx, panel)
		: drawDateBlock(ctx, panel)
	drawEntries(ctx, panel, listTop)
}

/** The ordinary head: a 170 px numeral over a 6 px accent rule. */
function drawDateBlock(ctx: CanvasRenderingContext2D, panel: Panel): number {
	monoLabel(ctx, panel, {
		text: weekdayName(panel),
		x: X,
		y: 43,
		size: 15,
		color: INK,
		tracking: 0.14,
		maxWidth: WIDTH * 0.6,
	})
	monoLabel(ctx, panel, {
		text: panel.t('page.week', { count: isoWeek(panel.day) }),
		x: RIGHT,
		y: 43,
		size: 15,
		color: INK,
		tracking: 0.14,
		align: 'right',
	})

	drawText(ctx, {
		text: String(panel.day.getDate()),
		x: X,
		y: 178,
		size: 170,
		font: panel.font,
		color: INK,
		weight: 900,
		tracking: -0.06,
	})
	drawText(ctx, {
		text: monthShort(panel.locale, panel.day).replace('.', ''),
		x: RIGHT,
		y: 146,
		size: 36,
		font: panel.font,
		color: INK,
		weight: 800,
		align: 'right',
	})
	drawText(ctx, {
		text: String(panel.day.getFullYear()),
		x: RIGHT,
		y: 178,
		size: 26,
		font: panel.font,
		color: INK,
		weight: 700,
		align: 'right',
	})
	fillRect(ctx, X, 190, WIDTH, 6, panel.accent)

	return listHead(ctx, panel, 224)
}

/** The birthday state: a solid accent top third, date demoted below it. */
function drawBirthdayBlock(ctx: CanvasRenderingContext2D, panel: Panel): number {
	const celebrant = panel.celebrants[0]
	const extras = extraCelebrants(panel)

	fillRect(ctx, 0, 0, 480, 280, panel.accent)
	monoLabel(ctx, panel, {
		text: `${weekdayName(panel)} ${panel.day.getDate()} ${monthShort(panel.locale, panel.day).replace('.', '')}`,
		x: X,
		y: 43,
		size: 15,
		color: WHITE,
		tracking: 0.14,
		maxWidth: WIDTH * 0.7,
	})
	monoLabel(ctx, panel, {
		text: String(panel.day.getFullYear()),
		x: RIGHT,
		y: 43,
		size: 15,
		color: WHITE,
		tracking: 0.14,
		align: 'right',
	})
	monoLabel(ctx, panel, {
		text: panel.t('page.birthdayToday'),
		x: X,
		y: 95,
		size: 16,
		color: WHITE,
		weight: 700,
		tracking: 0.18,
	})
	drawText(ctx, {
		text: celebrant.name,
		x: X,
		y: 172,
		size: 88,
		font: panel.font,
		color: WHITE,
		weight: 900,
		tracking: -0.04,
		maxWidth: WIDTH,
	})

	if (celebrant.age === null) {
		drawText(ctx, {
			text: panel.t('page.birthday'),
			x: X,
			y: 226,
			size: 40,
			font: panel.font,
			color: WHITE,
			weight: 700,
			maxWidth: WIDTH,
		})
	} else {
		drawText(ctx, {
			text: String(celebrant.age),
			x: X,
			y: 244,
			size: 64,
			font: panel.font,
			color: WHITE,
			weight: 900,
		})
		drawText(ctx, {
			text: panel.t('page.yearsToday'),
			x: X + 100,
			y: 240,
			size: 26,
			font: panel.font,
			color: WHITE,
			weight: 700,
			maxWidth: WIDTH - 100,
		})
	}
	if (extras) {
		monoLabel(ctx, panel, {
			text: extras,
			x: X,
			y: 266,
			size: 14,
			color: WHITE,
			tracking: 0.1,
			maxWidth: WIDTH,
		})
	}

	// The date stays on the page, a third of the size it would otherwise be.
	drawText(ctx, {
		text: String(panel.day.getDate()),
		x: X,
		y: 378,
		size: 96,
		font: panel.font,
		color: INK,
		weight: 900,
		tracking: -0.05,
	})
	drawText(ctx, {
		text: monthShort(panel.locale, panel.day).replace('.', ''),
		x: RIGHT,
		y: 350,
		size: 28,
		font: panel.font,
		color: INK,
		weight: 800,
		align: 'right',
	})
	monoLabel(ctx, panel, {
		text: panel.t('page.week', { count: isoWeek(panel.day) }),
		x: RIGHT,
		y: 378,
		size: 20,
		color: INK,
		weight: 700,
		align: 'right',
	})
	fillRect(ctx, X, 390, WIDTH, 6, INK)

	return listHead(ctx, panel, 424)
}

/** The "Next entries" kicker. Returns the top of the first row. */
function listHead(ctx: CanvasRenderingContext2D, panel: Panel, baseline: number): number {
	monoLabel(ctx, panel, {
		text: panel.t('page.nextEntries'),
		x: X,
		y: baseline,
		size: 14,
		color: INK,
		tracking: 0.2,
	})
	return baseline + 12
}

/** Equal-height rows that share the rest of the page. */
function drawEntries(ctx: CanvasRenderingContext2D, panel: Panel, top: number): void {
	const entries = panel.upcoming.slice(0, Math.max(1, Math.floor((BOTTOM - top) / 120)))
	if (entries.length === 0) return

	const rowHeight = (BOTTOM - top) / entries.length
	const nameSize = rowHeight > 150 ? 34 : 28

	entries.forEach((entry, index) => {
		const rowTop = top + index * rowHeight
		fillRect(ctx, X, rowTop, WIDTH, 2, INK)
		drawRow(ctx, panel, entry, rowTop + rowHeight / 2, nameSize)
	})
	fillRect(ctx, X, BOTTOM, WIDTH, 2, INK)
}

function drawRow(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	entry: PanelEntry,
	centre: number,
	nameSize: number,
): void {
	const age = entry.age === null ? null : String(entry.age)
	const nameWidth = age ? WIDTH - 70 : WIDTH

	drawText(ctx, {
		text: entry.name,
		x: X,
		y: centre - 4,
		size: nameSize,
		font: panel.font,
		color: INK,
		weight: 900,
		tracking: -0.01,
		maxWidth: nameWidth,
	})
	if (age) {
		drawText(ctx, {
			text: age,
			x: RIGHT,
			y: centre - 4,
			size: nameSize * 0.76,
			font: panel.font,
			color: panel.accent,
			weight: 800,
			align: 'right',
		})
	}

	monoLabel(ctx, panel, {
		text: entryDateLine(panel, entry),
		x: X,
		y: centre + 26,
		size: 16,
		color: INK,
		tracking: 0.06,
		maxWidth: WIDTH - 110,
	})
	monoLabel(ctx, panel, {
		text: countdown(panel, entry),
		x: RIGHT,
		y: centre + 26,
		size: 16,
		color: INK,
		tracking: 0.06,
		align: 'right',
		upper: false,
	})
}
