/*
 * The app window in browser mode (`src-tauri/src/browser.rs`). The system
 * webview is too old for the UI, so this page is plain on purpose: no cascivo,
 * no bundle, and syntax old engines can parse. The app injects the link and
 * the engine version as `window.__EPAPER_BROWSER_MODE__` before it runs.
 */
;(() => {
	const mode = window.__EPAPER_BROWSER_MODE__ || { url: '', engine: '' }
	const german = /^de/i.test(navigator.language || '')
	const text = german
		? {
				lang: 'de',
				title: 'E-Paper Studio läuft auf diesem Computer im Browser',
				why: 'Die App zeichnet ihre Oberfläche sonst mit dem Browser-Baustein des Systems, und der ist hier zu alt. Ein aktueller Browser kann es trotzdem.',
				how: 'Öffne diesen Link in einem Browser deiner Wahl – Safari 17.4, Chrome oder Edge 114, Firefox 125 oder neuer:',
				copy: 'Kopieren',
				copied: 'Kopiert',
				keep: 'Lass dieses Fenster offen, solange du arbeitest. Wenn du es schließt, beendest du E-Paper Studio, und der Link funktioniert nicht mehr. Er gilt nur auf diesem Computer.',
				pickers:
					'Ordner und Dateien wählst du weiter in den gewohnten Fenstern des Systems. Sie gehören zu E-Paper Studio und erscheinen darum vor dem Browser – danach wechselst du zurück.',
				engine: 'Browser-Baustein des Systems:',
			}
		: {
				lang: 'en',
				title: 'On this computer, E-Paper Studio runs in your browser',
				why: "The app normally draws its window with the system's built-in web engine, and the one here is too old. A current browser can still run it.",
				how: 'Open this link in a browser of your choice – Safari 17.4, Chrome or Edge 114, Firefox 125 or later:',
				copy: 'Copy',
				copied: 'Copied',
				keep: 'Keep this window open while you work. Closing it quits E-Paper Studio, and the link stops working. It only works on this computer.',
				pickers:
					"You still pick folders and files in the system's usual dialogs. They belong to E-Paper Studio, so they appear in front of the browser – switch back to it afterwards.",
				engine: 'System web engine:',
			}

	document.documentElement.lang = text.lang
	const set = (id, content) => {
		document.getElementById(id).textContent = content
	}
	set('title', text.title)
	set('why', text.why)
	set('how', text.how)
	set('copy', text.copy)
	set('keep', text.keep)
	set('pickers', text.pickers)
	set('engine', `${text.engine} ${mode.engine}`)

	// Plain text, not a link: followed in this window, the UI would load into
	// the very engine that cannot show it.
	const url = document.getElementById('url')
	url.value = mode.url
	url.addEventListener('focus', () => url.select())
	document.getElementById('copy').addEventListener('click', () => {
		url.select()
		// execCommand, because the Clipboard API is missing or refused in old webviews.
		if (document.execCommand('copy')) set('copy', text.copied)
	})
})()
