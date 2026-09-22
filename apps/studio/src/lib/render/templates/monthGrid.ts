import { weeksOf } from '../../date'
import { drawText, fillRect, INK, MONO, strokeRect, WHITE } from '../draw'
import { weekdayHeadings } from '../locale'
import type { Panel } from '../panel'

/** How "today" is marked, per the brief's MonthGrid API. */
export type MonthGridVariant = 'ring' | 'block' | 'dot'

const CELL = 34
const GAP = 2
const HEAD_SIZE = 14
const HEAD_GAP = 6

/** The height a grid of `rows` weeks occupies, so callers can place it. */
export function monthGridHeight(rows: number): number {
	return HEAD_SIZE + HEAD_GAP + rows * CELL + (rows - 1) * GAP
}

export function monthGridRows(panel: Panel): number {
	return weeksOf(panel.day.getFullYear(), panel.day.getMonth(), panel.weekStartsOn).length
}

/**
 * The month overview shared by designs 1a–1d.
 *
 * Marked days take a 3 px accent rule under the number; today takes the
 * variant's mark and wins over it. Columns stretch to `width`, but the marked
 * and today cells stay the 34 px square the brief fixes them at.
 */
export function drawMonthGrid(
	ctx: CanvasRenderingContext2D,
	panel: Panel,
	options: { x: number; y: number; width: number; variant: MonthGridVariant },
): void {
	const { x, y, width, variant } = options
	const { accent, font, locale, weekStartsOn, day } = panel
	const column = (width - GAP * 6) / 7
	const centreOf = (index: number) => x + index * (column + GAP) + column / 2

	weekdayHeadings(locale, weekStartsOn).forEach((heading, index) => {
		drawText(ctx, {
			text: heading.toLocaleUpperCase(locale),
			x: centreOf(index),
			y: y + HEAD_SIZE,
			size: HEAD_SIZE,
			font: MONO,
			color: INK,
			weight: 600,
			tracking: 0.06,
			align: 'center',
			maxWidth: column,
		})
	})

	const today = day.getDate()
	const marks = new Set(panel.marks)
	const top = y + HEAD_SIZE + HEAD_GAP

	weeksOf(day.getFullYear(), day.getMonth(), weekStartsOn).forEach((week, row) => {
		const cellTop = top + row * (CELL + GAP)
		week.forEach((dayNumber, index) => {
			if (dayNumber === 0) return
			const centreX = centreOf(index)
			const left = centreX - CELL / 2
			const isToday = dayNumber === today

			if (isToday) {
				if (variant === 'dot') strokeRect(ctx, left, cellTop, CELL, CELL, accent, 2)
				else if (variant === 'ring') fillCircle(ctx, centreX, cellTop + CELL / 2, CELL / 2, accent)
				else fillRect(ctx, left, cellTop, CELL, CELL, accent)
			} else if (marks.has(dayNumber)) {
				fillRect(ctx, left, cellTop + CELL - 3, CELL, 3, accent)
			}

			drawText(ctx, {
				text: String(dayNumber).padStart(2, '0'),
				x: centreX,
				y: cellTop + CELL / 2 + 6.5,
				size: 18,
				font,
				color: isToday && variant !== 'dot' ? WHITE : INK,
				weight: isToday ? 800 : 700,
				align: 'center',
			})
		})
	})
}

function fillCircle(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	color: string,
): void {
	ctx.beginPath()
	ctx.arc(x, y, radius, 0, Math.PI * 2)
	ctx.fillStyle = color
	ctx.fill()
}
