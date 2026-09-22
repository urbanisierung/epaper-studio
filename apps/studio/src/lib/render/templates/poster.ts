import { drawText, fillRect, INK } from '../draw'
import { monthLong } from '../locale'
import type { Panel, PanelEntry } from '../panel'
import {
	bornYearsLine,
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

const X = 24
const RIGHT = 456
const WIDTH = RIGHT - X
const FOOTER_HEIGHT = 100

/**
 * 1d Poster — one huge numeral with the next entries in a footer band.
 *
 * On a birthday the age takes the centre, outlined in the accent at 200 px,
 * with the name below it; the footer drops to two columns.
 */
export function drawPoster(ctx: CanvasRenderingContext2D, panel: Panel): void {
	const celebrant = panel.celebrants[0] ?? null

	drawText(ctx, {
		text: celebrant
			? panel.t('page.birthdayToday')
			: monthLong(panel.locale, panel.day.getFullYear(), panel.day.getMonth()),
		x: X,
		y: 74,
		size: 38,
		font: panel.font,
		color: celebrant ? panel.accent : INK,
		weight: 900,
		tracking: -0.02,
		maxWidth: WIDTH,
	})
	monoLabel(ctx, panel, {
		text: celebrant ? `${weekdayName(panel)} ${panel.day.getDate()}` : weekdayName(panel),
		x: X,
		y: 96,
		size: 15,
		color: INK,
		tracking: 0.14,
		maxWidth: WIDTH * 0.7,
	})
	monoLabel(ctx, panel, {
		text: String(panel.day.getFullYear()),
		x: RIGHT,
		y: 96,
		size: 15,
		color: INK,
		tracking: 0.14,
		align: 'right',
	})
	fillRect(ctx, X, 106, WIDTH, 3, panel.accent)

	const gridTop = 778 - monthGridHeight(monthGridRows(panel))
	const footerTop = gridTop - 24 - FOOTER_HEIGHT

	if (celebrant) drawCelebrantCentre(ctx, panel, celebrant, 110, footerTop)
	else drawNumeralCentre(ctx, panel, 110, footerTop)

	drawFooter(ctx, panel, footerTop, celebrant ? 2 : 3)
	drawMonthGrid(ctx, panel, { x: X, y: gridTop, width: WIDTH, variant: 'block' })
}

function drawNumeralCentre(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	top: number,
	bottom: number,
): void {
	drawText(ctx, {
		text: String(panel.day.getDate()),
		x: 240,
		y: (top + bottom) / 2 + 91,
		size: 250,
		font: panel.font,
		color: INK,
		weight: 900,
		tracking: -0.08,
		align: 'center',
	})
}

/** The age, outlined in the accent, with the name under it. */
function drawCelebrantCentre(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	celebrant: Panel['celebrants'][number],
	top: number,
	bottom: number,
): void {
	const extras = extraCelebrants(panel)
	const centre = (top + bottom) / 2

	if (celebrant.age === null) {
		drawText(ctx, {
			text: celebrant.name,
			x: 240,
			y: centre + 20,
			size: 72,
			font: panel.font,
			color: INK,
			weight: 900,
			tracking: -0.02,
			align: 'center',
			maxWidth: WIDTH,
		})
	} else {
		drawText(ctx, {
			text: String(celebrant.age),
			x: 240,
			y: centre - 12,
			size: 200,
			font: panel.font,
			color: panel.accent,
			weight: 900,
			tracking: -0.08,
			align: 'center',
			strokeWidth: 5,
		})
		drawText(ctx, {
			text: celebrant.name,
			x: 240,
			y: centre + 30,
			size: 48,
			font: panel.font,
			color: INK,
			weight: 900,
			tracking: -0.02,
			align: 'center',
			maxWidth: WIDTH,
		})
	}

	const caption = extras ?? bornYearsLine(panel, celebrant) ?? celebrantAgeLine(panel, celebrant)
	monoLabel(ctx, panel, {
		text: caption,
		x: 240,
		y: centre + 56,
		size: 15,
		color: INK,
		tracking: 0.2,
		align: 'center',
		maxWidth: WIDTH,
	})
}

/** The band of next entries, in `columns` equal columns. */
function drawFooter(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	top: number,
	columns: number,
): void {
	fillRect(ctx, 0, top, 480, 1, INK)
	monoLabel(ctx, panel, {
		text: panel.t('page.nextUp'),
		x: X,
		y: top + 29,
		size: 13,
		color: INK,
		tracking: 0.2,
	})

	const gap = 10
	const columnWidth = (WIDTH - gap * (columns - 1)) / columns
	panel.upcoming.slice(0, columns).forEach((entry, index) => {
		drawColumn(ctx, panel, entry, X + index * (columnWidth + gap), top + 40, columnWidth)
	})
}

function drawColumn(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	entry: PanelEntry,
	x: number,
	top: number,
	width: number,
): void {
	fillRect(ctx, x, top, width, 4, entry.kind === 'birthday' ? panel.accent : INK)
	monoLabel(ctx, panel, {
		text: `${stampDay(entry.at)} ${stampMonth(panel, entry.at)}`,
		x,
		y: top + 25,
		size: 14,
		color: INK,
		weight: 700,
		maxWidth: width,
	})
	drawText(ctx, {
		text: entry.name,
		x,
		y: top + 46,
		size: 18,
		font: panel.font,
		color: INK,
		weight: 700,
		maxWidth: width,
	})
	drawText(ctx, {
		text: `${entryKindLabel(panel, entry)} · ${countdown(panel, entry)}`,
		x,
		y: top + 65,
		size: 15,
		font: panel.font,
		color: INK,
		weight: 600,
		maxWidth: width,
	})
}
