import type { Orientation } from '../types'
import { orientationOf } from '../types'

/**
 * Where everything sits on the page.
 *
 * The original hardcoded coordinates for a 480x800 portrait panel. These are
 * derived from the page size instead, and the portrait formulas are chosen so
 * that 480x800 comes out at exactly the original numbers: margin 30, a 200 px
 * tile at x=250/y=30, the event list at 30/60 with a 30 px face, and a 360 px
 * wide month grid starting at y=400.
 */
export interface PageLayout {
	orientation: Orientation
	margin: number
	tile: { x: number; y: number; size: number }
	events: { x: number; y: number; width: number; fontSize: number; gap: number }
	/**
	 * The chore strip has no `y` of its own: it starts wherever the event list
	 * happens to end, which depends on how many entries that day has. `bottom`
	 * is the line it may not cross, and the renderer fits as many rows as the
	 * space between the two allows.
	 */
	chores: { x: number; width: number; fontSize: number; gap: number; bottom: number }
	grid: { x: number; y: number; width: number; fontSize: number; gap: number }
}

export function computeLayout(width: number, height: number): PageLayout {
	return orientationOf(width, height) === 'portrait'
		? portraitLayout(width, height)
		: landscapeLayout(width, height)
}

function portraitLayout(width: number, height: number): PageLayout {
	const margin = width / 16 // 30 at 480 wide
	const tileSize = height / 4 // 200 at 800 tall
	const tileX = width - tileSize - margin // 250
	const gridWidth = width * 0.75 // 360
	const gridFontSize = margin // 30

	return {
		orientation: 'portrait',
		margin,
		tile: { x: tileX, y: margin, size: tileSize },
		events: {
			x: margin,
			y: margin * 2,
			width: tileX - margin * 2,
			fontSize: margin,
			gap: margin / 3, // 10
		},
		chores: {
			x: margin,
			width: width - margin * 2,
			fontSize: margin * 0.7, // 21 at 480 wide
			gap: margin / 3,
			bottom: height / 2 - margin * 0.5, // stops clear of the month heading
		},
		grid: {
			x: (width - gridWidth) / 2, // 60
			y: height / 2, // 400
			width: gridWidth,
			fontSize: gridFontSize,
			gap: (gridWidth - 7 * gridFontSize) / 6, // 25
		},
	}
}

/**
 * Landscape has no room for a grid below the tile, so the page splits down the
 * middle: tile and event list on the left, month grid on the right.
 */
function landscapeLayout(width: number, height: number): PageLayout {
	const margin = height / 16 // 30 at 480 tall
	const tileSize = height * 0.42 // 202
	const half = width / 2

	const gridWidth = width * 0.42 // 336
	const gridFontSize = gridWidth / 12 // 28

	return {
		orientation: 'landscape',
		margin,
		tile: { x: margin, y: margin, size: tileSize },
		events: {
			x: margin,
			y: margin + tileSize + margin * 1.4,
			width: half - margin * 2,
			fontSize: margin * 0.75,
			gap: margin / 4,
		},
		chores: {
			x: margin,
			width: half - margin * 2,
			fontSize: margin * 0.6,
			gap: margin / 4,
			// The left column is the chore strip's alone, so it may run to the foot.
			bottom: height - margin,
		},
		grid: {
			x: half + (half - gridWidth) / 2,
			y: margin + gridFontSize * 1.5,
			width: gridWidth,
			fontSize: gridFontSize,
			gap: (gridWidth - 7 * gridFontSize) / 6,
		},
	}
}
