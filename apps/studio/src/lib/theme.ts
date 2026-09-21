import { useEffect, useState } from 'react'

/**
 * The twelve first-party cascivo themes. The export name is the `data-theme`
 * value, so this list doubles as the set of values `ThemeProvider` accepts.
 */
export const THEMES = [
	'brutalist',
	'light',
	'dark',
	'warm',
	'flat',
	'minimal',
	'midnight',
	'pastel',
	'corporate',
	'terminal',
	'cyberpunk',
	'arcade',
] as const

export type ThemeName = (typeof THEMES)[number]

/** What the project stores. `system` follows the OS light/dark preference. */
export type ThemeSetting = ThemeName | 'system'

export function isThemeSetting(value: unknown): value is ThemeSetting {
	return value === 'system' || THEMES.includes(value as ThemeName)
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

function systemTheme(): ThemeName {
	return typeof window !== 'undefined' && window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
}

/**
 * Turns the stored setting into the theme actually showing.
 *
 * `ThemeProvider` takes a concrete theme name, so `system` is resolved here —
 * and the listener keeps the app in step when the OS switches over at dusk.
 */
export function useResolvedTheme(setting: ThemeSetting): ThemeName {
	const [system, setSystem] = useState(systemTheme)

	useEffect(() => {
		const media = window.matchMedia?.(DARK_QUERY)
		if (!media) return
		const onChange = () => setSystem(media.matches ? 'dark' : 'light')
		media.addEventListener('change', onChange)
		return () => media.removeEventListener('change', onChange)
	}, [])

	return setting === 'system' ? system : setting
}
