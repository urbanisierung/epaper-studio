/**
 * The canvas primitives every page design is drawn with.
 *
 * The panel brief specifies its layouts in CSS — fills, rules, tracked
 * uppercase labels and outlined numerals. These are the canvas equivalents, so
 * a template file reads as a transcription of the design rather than as a
 * pile of `ctx` calls.
 */

/** The panel prints one accent on white, so display text is only ever these. */
export const INK = '#000000'
export const WHITE = '#ffffff'

/**
 * The face used for labels, dates and countdowns.
 *
 * The brief asks for IBM Plex Mono. Nothing is bundled with the app, so the
 * platform's own monospace stands in — the designs only need it to be
 * monospaced and to carry weight 600 and 700.
 */
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export interface TextOptions {
	text: string
	x: number
	y: number
	size: number
	font: string
	color: string
	/** CSS numeric weight. The designs run 600–900; 400 is never used. */
	weight?: number
	align?: CanvasTextAlign
	/** Tracking in ems, as the designs express it (`.14em`, `-.05em`). */
	tracking?: number
	/** Longer text is cut and ellipsised rather than running off the page. */
	maxWidth?: number
	/** Draws the glyphs hollow, for the outlined numerals in 1b and 1d. */
	strokeWidth?: number
}

export function drawText(ctx: CanvasRenderingContext2D, options: TextOptions): void {
	applyFont(ctx, options.size, options.font, options.weight, options.tracking)
	ctx.textAlign = options.align ?? 'left'

	const text = ellipsise(ctx, options.text, options.maxWidth)
	if (options.strokeWidth) {
		ctx.lineWidth = options.strokeWidth
		ctx.lineJoin = 'round'
		ctx.strokeStyle = options.color
		ctx.strokeText(text, options.x, options.y)
	} else {
		ctx.fillStyle = options.color
		ctx.fillText(text, options.x, options.y)
	}
	resetTracking(ctx)
}

/** Width of a string in the same face `drawText` would use for it. */
export function measureText(
	ctx: CanvasRenderingContext2D,
	options: Pick<TextOptions, 'text' | 'size' | 'font' | 'weight' | 'tracking'>,
): number {
	applyFont(ctx, options.size, options.font, options.weight, options.tracking)
	const width = ctx.measureText(options.text).width
	resetTracking(ctx)
	return width
}

/** A filled rectangle — the accent blocks, rules and tiles the designs use. */
export function fillRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	color: string,
): void {
	ctx.fillStyle = color
	ctx.fillRect(x, y, width, height)
}

/** An outlined rectangle, drawn inside the given box the way `border-box` is. */
export function strokeRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	color: string,
	lineWidth: number,
): void {
	ctx.strokeStyle = color
	ctx.lineWidth = lineWidth
	ctx.strokeRect(x + lineWidth / 2, y + lineWidth / 2, width - lineWidth, height - lineWidth)
}

/**
 * Breaks `text` over at most `maxLines` lines of `maxWidth`, ellipsising the
 * last one. The caller sets the face first, via {@link measureText} or
 * {@link fontSpec} — only the tiles design needs this, for one headline.
 */
export function wrapLines(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	maxLines: number,
): string[] {
	const lines: string[] = []
	let line = ''

	for (const word of text.split(' ')) {
		const candidate = line ? `${line} ${word}` : word
		if (line && ctx.measureText(candidate).width > maxWidth) {
			lines.push(line)
			line = word
		} else {
			line = candidate
		}
	}
	lines.push(line)

	if (lines.length <= maxLines) return lines
	const kept = lines.slice(0, maxLines - 1)
	kept.push(ellipsise(ctx, lines.slice(maxLines - 1).join(' '), maxWidth))
	return kept
}

export function fontSpec(size: number, family: string, weight = 400): string {
	// A comma means a stack (the mono one); a bare family has to be quoted.
	const stack = family.includes(',') ? family : `"${family}"`
	return `${weight} ${size}px ${stack}`
}

export function ellipsise(ctx: CanvasRenderingContext2D, text: string, maxWidth?: number): string {
	if (!maxWidth || ctx.measureText(text).width <= maxWidth) return text
	let truncated = text
	while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
		truncated = truncated.slice(0, -1)
	}
	return `${truncated}…`
}

/** The largest size at or below `size` that keeps every string inside `maxWidth`. */
export function fitFontSize(
	ctx: CanvasRenderingContext2D,
	texts: string[],
	family: string,
	size: number,
	maxWidth: number,
	weight = 400,
): number {
	ctx.font = fontSpec(size, family, weight)
	const widest = Math.max(...texts.map((text) => ctx.measureText(text).width))
	if (widest <= maxWidth) return size
	return Math.max(size * 0.5, (size * maxWidth) / widest)
}

export function roundedRect(
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

function applyFont(
	ctx: CanvasRenderingContext2D,
	size: number,
	family: string,
	weight?: number,
	tracking?: number,
): void {
	ctx.font = fontSpec(size, family, weight)
	// `letterSpacing` is recent enough that a webview may not have it; without
	// it the tracked labels simply set tighter, which the designs survive.
	if (tracking !== undefined && 'letterSpacing' in ctx) {
		ctx.letterSpacing = `${tracking * size}px`
	}
}

function resetTracking(ctx: CanvasRenderingContext2D): void {
	if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
}
