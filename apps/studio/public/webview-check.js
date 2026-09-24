/*
 * Runs before the app bundle, and is written so that old engines can parse it:
 * the bundle itself is a syntax error on Safari 13, and on anything older than
 * cascivo's floor (Safari 17.4, Chromium 114) it crashes on its first render.
 * Either way the window would stay white, so this says why instead.
 *
 * Tauri renders with the system's own engine — WebKit on macOS, WebView2 on
 * Windows — so the fix is on the user's side, and the message says what it is.
 */
;(() => {
	const supported =
		typeof HTMLElement !== 'undefined' &&
		typeof HTMLElement.prototype.showPopover === 'function' &&
		typeof CSSLayerBlockRule !== 'undefined' &&
		typeof CSS !== 'undefined' &&
		CSS.supports('color', 'oklch(0 0 0)')
	if (supported) return

	const german = /^de/i.test(navigator.language || '')
	const text = german
		? {
				title: 'Dieser Computer ist zu alt für E-Paper Studio',
				body: 'Die App zeichnet ihre Oberfläche mit dem Browser-Baustein des Systems, und der ist hier zu alt.',
				mac: 'macOS: 14.4 Sonoma oder neuer. Apps nutzen den Browser-Baustein, der mit macOS kommt – ein neueres Safari ändert daran nichts, das nutzt nur Safari selbst.',
				windows:
					'Windows: „Microsoft Edge WebView2 Runtime“ in Version 114 oder neuer (unter Apps und Features aktualisieren oder bei Microsoft neu installieren).',
				engine: 'Erkannter Browser-Baustein:',
			}
		: {
				title: 'This computer is too old for E-Paper Studio',
				body: "The app draws its window with the system's built-in web engine, and the one here is too old.",
				mac: 'macOS: 14.4 Sonoma or later. Apps use the web engine that comes with macOS – installing a newer Safari does not change it, only Safari itself uses that.',
				windows:
					'Windows: "Microsoft Edge WebView2 Runtime" version 114 or later (update it under Apps & features, or reinstall it from Microsoft).',
				engine: 'Detected web engine:',
			}

	const message = document.createElement('main')
	message.style.cssText =
		'font: 15px/1.5 system-ui, sans-serif; color: #111; max-width: 38rem; margin: 3rem auto; padding: 0 1.5rem;'
	const add = (tag, content, style) => {
		const element = document.createElement(tag)
		element.textContent = content
		if (style) element.style.cssText = style
		message.appendChild(element)
	}
	add('h1', text.title, 'font-size: 1.4rem; margin: 0 0 1rem;')
	add('p', text.body)
	add('p', text.mac)
	add('p', text.windows)
	add('p', `${text.engine} ${navigator.userAgent}`, 'font-size: 12px; color: #555;')

	// Without `#root` the bundle has nothing to mount into, so it never renders.
	const root = document.getElementById('root')
	if (root) root.replaceWith(message)
	else document.body.appendChild(message)
})()
