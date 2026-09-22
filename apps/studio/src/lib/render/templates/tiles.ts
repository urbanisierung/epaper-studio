import {
	drawText,
	fillRect,
	fontSpec,
	INK,
	measureText,
	strokeRect,
	WHITE,
	wrapLines,
} from '../draw'
import { monthLong, monthShort, weekdayShort } from '../locale'
import type { Panel, PanelEntry } from '../panel'
import {
	celebrantAgeLine,
	countdown,
	entryKindLabel,
	extraCelebrants,
	monoLabel,
	stampDay,
	stampMonth,
} from './kit'
import { drawMonthGrid, monthGridHeight, monthGridRows } from './monthGrid'

const X = 24
const RIGHT = 456
const WIDTH = RIGHT - X
const TILE = 196
const CARD_HEIGHT = 64
const CARD_GAP = 8

/**
 * 1c Tiles — a square date tile beside a summary, then bordered event cards.
 *
 * On a birthday the tile flips to the accent, the summary becomes an
 * accent-outlined card, and a reversed greeting bar spans the width.
 */
export function drawTiles(ctx: CanvasRenderingContext2D, panel: Panel): void {
	const celebrant = panel.celebrants[0] ?? null
	drawTile(ctx, panel, celebrant !== null)
	const summaryBottom = celebrant ? drawGreeting(ctx, panel, celebrant.name) : X + TILE

	if (celebrant) drawCelebrantCard(ctx, panel, celebrant)
	else drawSummary(ctx, panel)

	monoLabel(ctx, panel, {
		text: panel.t('page.ahead'),
		x: X,
		y: summaryBottom + 24,
		size: 14,
		color: INK,
		tracking: 0.16,
	})

	const cardsTop = summaryBottom + 36
	const boxTop = 776 - monthBoxHeight(panel)
	const cards = Math.max(
		0,
		Math.floor((boxTop - 12 - cardsTop + CARD_GAP) / (CARD_HEIGHT + CARD_GAP)),
	)
	panel.upcoming.slice(0, cards).forEach((entry, index) => {
		drawCard(ctx, panel, entry, cardsTop + index * (CARD_HEIGHT + CARD_GAP))
	})

	drawMonthBox(ctx, panel, boxTop)
}

/** The 196 px date tile: black normally, accent on a birthday. */
function drawTile(ctx: CanvasRenderingContext2D, panel: Panel, celebrating: boolean): void {
	fillRect(ctx, X, X, TILE, TILE, celebrating ? panel.accent : INK)
	monoLabel(ctx, panel, {
		text: weekdayShort(panel.locale, panel.day).replace('.', ''),
		x: X + 16,
		y: X + 30,
		size: 16,
		color: WHITE,
		weight: 700,
		tracking: 0.1,
	})
	monoLabel(ctx, panel, {
		text: monthShort(panel.locale, panel.day).replace('.', ''),
		x: X + TILE - 16,
		y: X + 30,
		size: 16,
		color: WHITE,
		weight: 700,
		tracking: 0.1,
		align: 'right',
	})
	drawText(ctx, {
		text: String(panel.day.getDate()).padStart(2, '0'),
		x: X + 16,
		y: X + TILE - 18,
		size: 100,
		font: panel.font,
		color: WHITE,
		weight: 900,
		tracking: -0.05,
	})
}

/** What today holds, in the column beside the tile. */
function drawSummary(ctx: CanvasRenderingContext2D, panel: Panel): void {
	const x = X + TILE + 16
	const width = RIGHT - x
	const today = panel.upcoming.find((entry) => entry.days === 0)

	monoLabel(ctx, panel, {
		text: panel.t('page.today'),
		x,
		y: 41,
		size: 14,
		color: INK,
		tracking: 0.16,
	})

	ctx.font = fontSpec(26, panel.font, 700)
	wrapLines(ctx, today?.name ?? panel.t('page.noEventsToday'), width, 2).forEach((line, index) => {
		drawText(ctx, {
			text: line,
			x,
			y: 120 + index * 30,
			size: 26,
			font: panel.font,
			color: INK,
			weight: 700,
		})
	})

	fillRect(ctx, x, 186, width, 1, INK)
	drawText(ctx, {
		text: panel.t('page.entriesThisMonth', { count: panel.marks.length }),
		x,
		y: 206,
		size: 16,
		font: panel.font,
		color: INK,
		weight: 600,
		maxWidth: width,
	})
}

/** The birthday state's accent-outlined card, in place of the summary. */
function drawCelebrantCard(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	celebrant: Panel['celebrants'][number],
): void {
	const x = X + TILE + 16
	const width = RIGHT - x
	const extras = extraCelebrants(panel)

	strokeRect(ctx, x, X, width, TILE, panel.accent, 2)
	monoLabel(ctx, panel, {
		text: panel.t('page.birthdayToday'),
		x: x + 14,
		y: 78,
		size: 13,
		color: panel.accent,
		tracking: 0.2,
		maxWidth: width - 28,
	})
	drawText(ctx, {
		text: celebrant.name,
		x: x + 14,
		y: 124,
		size: 36,
		font: panel.font,
		color: INK,
		weight: 900,
		tracking: -0.02,
		maxWidth: width - 28,
	})
	drawText(ctx, {
		text: celebrantAgeLine(panel, celebrant),
		x: x + 14,
		y: 152,
		size: 20,
		font: panel.font,
		color: INK,
		weight: 700,
		maxWidth: width - 28,
	})
	if (extras) {
		monoLabel(ctx, panel, {
			text: extras,
			x: x + 14,
			y: 178,
			size: 13,
			color: INK,
			tracking: 0.08,
			maxWidth: width - 28,
		})
	}
}

/** The reversed greeting bar. Returns the y it ends at. */
function drawGreeting(ctx: CanvasRenderingContext2D, panel: Panel, name: string): number {
	const top = X + TILE + 12
	fillRect(ctx, X, top, WIDTH, 38, panel.accent)
	monoLabel(ctx, panel, {
		text: panel.t('page.happyBirthday', { name }),
		x: X + WIDTH / 2,
		y: top + 25,
		size: 15,
		color: WHITE,
		tracking: 0.14,
		align: 'center',
		maxWidth: WIDTH - 24,
	})
	return top + 38
}

function drawCard(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	entry: PanelEntry,
	top: number,
): void {
	strokeRect(ctx, X, top, WIDTH, CARD_HEIGHT, INK, 1.5)

	const chipX = X + 12
	const chipY = top + 9
	if (entry.kind === 'birthday') fillRect(ctx, chipX, chipY, 46, 46, panel.accent)
	else strokeRect(ctx, chipX, chipY, 46, 46, INK, 1.5)

	const chipInk = entry.kind === 'birthday' ? WHITE : INK
	drawText(ctx, {
		text: stampDay(entry.at),
		x: chipX + 23,
		y: chipY + 24,
		size: 20,
		font: panel.font,
		color: chipInk,
		weight: 800,
		align: 'center',
	})
	monoLabel(ctx, panel, {
		text: stampMonth(panel, entry.at),
		x: chipX + 23,
		y: chipY + 39,
		size: 13,
		color: chipInk,
		weight: 600,
		tracking: 0.1,
		align: 'center',
	})

	const days = countdown(panel, entry)
	const daysWidth = measureText(ctx, { text: days, size: 15, font: panel.font, weight: 700 })
	monoLabel(ctx, panel, {
		text: days,
		x: RIGHT - 12,
		y: top + 38,
		size: 15,
		color: INK,
		weight: 700,
		align: 'right',
		upper: false,
	})

	const textX = chipX + 60
	const textWidth = RIGHT - 12 - textX - daysWidth - 12
	drawText(ctx, {
		text: entry.name,
		x: textX,
		y: top + 30,
		size: 21,
		font: panel.font,
		color: INK,
		weight: 700,
		maxWidth: textWidth,
	})
	drawText(ctx, {
		text: entryKindLabel(panel, entry),
		x: textX,
		y: top + 50,
		size: 16,
		font: panel.font,
		color: INK,
		weight: 600,
		maxWidth: textWidth,
	})
}

function monthBoxHeight(panel: Panel): number {
	return 12 + 22 + 8 + monthGridHeight(monthGridRows(panel)) + 12
}

function drawMonthBox(ctx: CanvasRenderingContext2D, panel: Panel, top: number): void {
	strokeRect(ctx, X, top, WIDTH, monthBoxHeight(panel), INK, 1.5)
	drawText(ctx, {
		text: `${monthLong(panel.locale, panel.day.getFullYear(), panel.day.getMonth())} ${panel.day.getFullYear()}`,
		x: X + 12,
		y: top + 30,
		size: 19,
		font: panel.font,
		color: INK,
		weight: 700,
		maxWidth: WIDTH - 24,
	})
	drawMonthGrid(ctx, panel, { x: X + 12, y: top + 42, width: WIDTH - 24, variant: 'block' })
}
