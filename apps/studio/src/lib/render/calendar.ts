import { startOfDay } from '../date'
import { PALETTE, type Project } from '../types'
import { type ChoreDuty, choresFor } from './chores'
import { entriesFor } from './entries'
import type { PageLayout } from './layout'
import { computeLayout } from './layout'
import { monthLong, monthShort, weekdayHeadings, weekdayShort } from './locale'

const WHITE = PALETTE.white
const INK = PALETTE.black

/**
 * Draws one calendar page.
 *
 * This is the port of `CalendarUtils` from `packages/shared-utils`, with the
 * German string arrays replaced by `Intl` and the hardcoded 480x800
 * coordinates replaced by {@link computeLayout}.
 */
export function drawPage(canvas: HTMLCanvasElement, project: Project, day: Date): void {
	const { width, height } = project.settings
	canvas.width = width
	canvas.height = height

	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('This system has no 2D canvas support.')

	const layout = computeLayout(width, height)
	const accent = PALETTE[project.settings.accentColor]
	const font = project.settings.fontFamily
	const entries = entriesFor(project, day)
	const highlighted = entries.some((entry) => entry.highlighted)

	ctx.fillStyle = WHITE
	ctx.fillRect(0, 0, width, height)

	drawDayTile(ctx, layout, day, project, accent, highlighted)
	const eventsBottom = drawEventList(ctx, layout, entries, font, accent)
	// The strip runs the full width of the page, so it has to start below the
	// day tile as well as below the event list — whichever of the two ends
	// lower. On a short event list it would otherwise cross the tile, and the
	// right-aligned names would land on top of it.
	const stripTop = Math.max(eventsBottom, layout.tile.y + layout.tile.size + layout.margin * 0.5)
	drawChoreStrip(ctx, layout, choresFor(project, day), font, accent, stripTop)
	drawMonthGrid(ctx, layout, day, project, accent)
}

function drawDayTile(
	ctx: CanvasRenderingContext2D,
	layout: PageLayout,
	day: Date,
	project: Project,
	accent: string,
	highlighted: boolean,
): void {
	const { x, y, size } = layout.tile
	const { locale, fontFamily } = project.settings

	roundedRect(ctx, x, y, size, size, size * 0.05)
	ctx.fillStyle = highlighted ? accent : INK
	ctx.fill()

	// The day number, large and centred.
	const numberSize = size * 0.6
	const centerX = x + size / 2
	const numberBaseline = y + size * 0.84
	drawText(ctx, {
		text: String(day.getDate()).padStart(2, '0'),
		x: centerX,
		y: numberBaseline,
		size: numberSize,
		font: fontFamily,
		color: WHITE,
		bold: true,
		align: 'center',
	})

	// Weekday and month straddle the centre line above it.
	const labelSize = numberSize * 0.3
	const labelBaseline = numberBaseline - numberSize * 0.8 - size * 0.07
	drawText(ctx, {
		text: weekdayShort(locale, day),
		x: centerX - size * 0.02,
		y: labelBaseline,
		size: labelSize,
		font: fontFamily,
		color: highlighted ? WHITE : accent,
		bold: true,
		align: 'right',
	})
	drawText(ctx, {
		text: monthShort(locale, day),
		x: centerX + size * 0.02,
		y: labelBaseline,
		size: labelSize,
		font: fontFamily,
		color: WHITE,
		bold: true,
		align: 'left',
	})
}

function drawEventList(
	ctx: CanvasRenderingContext2D,
	layout: PageLayout,
	entries: ReturnType<typeof entriesFor>,
	font: string,
	accent: string,
): number {
	const { x, y, width, fontSize, gap } = layout.events
	const subFactor = 0.6
	const nameHeight = fontSize + gap
	const subHeight = nameHeight * subFactor

	entries.forEach((entry, index) => {
		const baseline = y + index * (nameHeight + subHeight)
		const color = entry.highlighted ? accent : INK

		drawText(ctx, {
			text: entry.name,
			x,
			y: baseline,
			size: fontSize,
			font,
			color,
			maxWidth: width,
		})
		drawText(ctx, {
			text: entry.subtitle,
			x,
			y: baseline + subHeight,
			size: fontSize * subFactor,
			font,
			color,
			bold: true,
			maxWidth: width,
		})
	})

	return y + entries.length * (nameHeight + subHeight)
}

/**
 * Who is doing what today.
 *
 * A rule, then a row per chore: the job on the left, the name whose turn it is
 * on the right in the accent colour. Rows that would run into the month grid
 * are dropped rather than drawn over it — the list is already capped by
 * `maxChores`, this is the backstop for a day whose event list ran long.
 */
function drawChoreStrip(
	ctx: CanvasRenderingContext2D,
	layout: PageLayout,
	duties: ChoreDuty[],
	font: string,
	accent: string,
	top: number,
): void {
	if (duties.length === 0) return

	const { x, width, fontSize, gap, bottom } = layout.chores
	const rowHeight = fontSize + gap
	const ruleY = top + gap
	const firstBaseline = ruleY + gap + fontSize

	const fits = Math.floor((bottom - firstBaseline) / rowHeight) + 1
	const rows = Math.min(duties.length, Math.max(0, fits))
	if (rows === 0) return

	ctx.fillStyle = INK
	ctx.fillRect(x, ruleY, width, Math.max(1, fontSize / 12))

	// The names share a column, so the widest one sets where the jobs must stop.
	ctx.font = fontSpec(fontSize, font, true)
	const nameColumn = Math.max(
		...duties.slice(0, rows).map((duty) => (duty.person ? ctx.measureText(duty.person).width : 0)),
	)

	duties.slice(0, rows).forEach((duty, index) => {
		const baseline = firstBaseline + index * rowHeight
		drawText(ctx, {
			text: duty.name,
			x,
			y: baseline,
			size: fontSize,
			font,
			color: INK,
			maxWidth: width - nameColumn - gap,
		})
		if (duty.person) {
			drawText(ctx, {
				text: duty.person,
				x: x + width,
				y: baseline,
				size: fontSize,
				font,
				color: accent,
				bold: true,
				align: 'right',
			})
		}
	})
}

function drawMonthGrid(
	ctx: CanvasRenderingContext2D,
	layout: PageLayout,
	day: Date,
	project: Project,
	accent: string,
): void {
	const { x, y, width, fontSize, gap } = layout.grid
	const { locale, weekStartsOn, fontFamily } = project.settings
	const step = fontSize + gap

	drawText(ctx, {
		text: monthLong(locale, day.getFullYear(), day.getMonth()),
		x: x + width / 2,
		y,
		size: fontSize * 1.5,
		font: fontFamily,
		color: INK,
		align: 'center',
		maxWidth: width,
	})

	const tableTop = y + fontSize + gap
	const columnCenter = (column: number) => x + column * step + fontSize / 2

	// Headings shrink if the locale spells weekdays out (`Mon` vs `Mo`).
	const headings = weekdayHeadings(locale, weekStartsOn)
	const headingSize = fitFontSize(ctx, headings, fontFamily, fontSize, step * 0.92, true)
	headings.forEach((heading, column) => {
		drawText(ctx, {
			text: heading,
			x: columnCenter(column),
			y: tableTop,
			size: headingSize,
			font: fontFamily,
			color: INK,
			bold: true,
			align: 'center',
		})
	})

	const today = startOfDay(day).getTime()
	weeksOf(day.getFullYear(), day.getMonth(), weekStartsOn).forEach((week, weekIndex) => {
		const baseline = tableTop + (weekIndex + 1) * step
		week.forEach((dayNumber, column) => {
			if (dayNumber === 0) return
			const centerX = columnCenter(column)
			const isToday = new Date(day.getFullYear(), day.getMonth(), dayNumber).getTime() === today

			if (isToday) {
				ctx.beginPath()
				ctx.arc(centerX, baseline - fontSize / 3, fontSize, 0, Math.PI * 2)
				ctx.fillStyle = accent
				ctx.fill()
			}

			drawText(ctx, {
				text: String(dayNumber).padStart(2, '0'),
				x: centerX,
				y: baseline,
				size: fontSize,
				font: fontFamily,
				color: isToday ? WHITE : INK,
				align: 'center',
			})
		})
	})
}

/** Weeks of a month as day numbers, 0 for cells outside the month. */
export function weeksOf(year: number, monthIndex: number, weekStartsOn: 0 | 1): number[][] {
	const firstWeekday = new Date(year, monthIndex, 1).getDay()
	const leading = (firstWeekday - weekStartsOn + 7) % 7
	const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

	const cells: number[] = [...Array(leading).fill(0), ...range(1, daysInMonth)]
	while (cells.length % 7 !== 0) cells.push(0)

	const weeks: number[][] = []
	for (let index = 0; index < cells.length; index += 7) {
		weeks.push(cells.slice(index, index + 7))
	}
	return weeks
}

function range(from: number, to: number): number[] {
	return Array.from({ length: to - from + 1 }, (_, index) => from + index)
}

interface TextOptions {
	text: string
	x: number
	y: number
	size: number
	font: string
	color: string
	bold?: boolean
	align?: CanvasTextAlign
	/** Longer text is cut and ellipsised rather than running off the page. */
	maxWidth?: number
}

function drawText(ctx: CanvasRenderingContext2D, options: TextOptions): void {
	ctx.font = fontSpec(options.size, options.font, options.bold)
	ctx.fillStyle = options.color
	ctx.textAlign = options.align ?? 'left'
	ctx.fillText(ellipsise(ctx, options.text, options.maxWidth), options.x, options.y)
}

function fontSpec(size: number, family: string, bold?: boolean): string {
	return `${bold ? 'bold ' : ''}${size}px "${family}"`
}

function ellipsise(ctx: CanvasRenderingContext2D, text: string, maxWidth?: number): string {
	if (!maxWidth || ctx.measureText(text).width <= maxWidth) return text
	let truncated = text
	while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
		truncated = truncated.slice(0, -1)
	}
	return `${truncated}…`
}

/** The largest size at or below `size` that keeps every string inside `maxWidth`. */
function fitFontSize(
	ctx: CanvasRenderingContext2D,
	texts: string[],
	family: string,
	size: number,
	maxWidth: number,
	bold: boolean,
): number {
	ctx.font = fontSpec(size, family, bold)
	const widest = Math.max(...texts.map((text) => ctx.measureText(text).width))
	if (widest <= maxWidth) return size
	return Math.max(size * 0.5, (size * maxWidth) / widest)
}

function roundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
): void {
	ctx.beginPath()
	ctx.moveTo(x + radius, y)
	ctx.lineTo(x + width - radius, y)
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
	ctx.lineTo(x + width, y + height - radius)
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
	ctx.lineTo(x + radius, y + height)
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
	ctx.lineTo(x, y + radius)
	ctx.quadraticCurveTo(x, y, x + radius, y)
	ctx.closePath()
}
