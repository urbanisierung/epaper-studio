import type { PanelTemplate } from '../../types'
import type { Panel } from '../panel'
import { drawAgenda } from './agenda'
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './kit'
import { drawLedger } from './ledger'
import { drawMasthead } from './masthead'
import { drawPoster } from './poster'
import { drawTiles } from './tiles'

export { DESIGN_HEIGHT, DESIGN_WIDTH }

/**
 * The five designs from the panel brief.
 *
 * Each draws into a 480x800 coordinate space — `drawPage` scales that to the
 * panel — and reads everything it needs from {@link Panel}.
 */
export const PANEL_DESIGNS: Record<
	Exclude<PanelTemplate, 'classic'>,
	(ctx: CanvasRenderingContext2D, panel: Panel) => void
> = {
	masthead: drawMasthead,
	ledger: drawLedger,
	tiles: drawTiles,
	poster: drawPoster,
	agenda: drawAgenda,
}
