/**
 * Makes sure a face is actually loaded before anything is drawn with it.
 *
 * `document.fonts.ready` only waits for faces the page has already asked for.
 * A canvas never triggers a webfont load of its own, so drawing straight after
 * `ready` silently falls back to a serif — and since the layout measures text,
 * the fallback changes more than just the look.
 */
export async function ensureFont(family: string): Promise<void> {
	if (typeof document === 'undefined' || !document.fonts) return
	try {
		await Promise.all([
			document.fonts.load(`16px "${family}"`),
			document.fonts.load(`bold 16px "${family}"`),
		])
	} catch {
		// A family the system cannot supply falls back; that is the browser's call.
	}
	await document.fonts.ready
}
