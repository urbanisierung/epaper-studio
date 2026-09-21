/**
 * Every human-readable string the pages show, derived from the locale.
 *
 * The original had German arrays baked into the source; `Intl` produces the
 * same output for `de-DE` and works for everyone else too.
 */

export interface LocaleOption {
	tag: string
	label: string
}

/** Offered in the UI; any other BCP 47 tag can be typed in. */
export const LOCALES: LocaleOption[] = [
	{ tag: 'de-DE', label: 'Deutsch' },
	{ tag: 'en-GB', label: 'English (UK)' },
	{ tag: 'en-US', label: 'English (US)' },
	{ tag: 'fr-FR', label: 'Français' },
	{ tag: 'es-ES', label: 'Español' },
	{ tag: 'it-IT', label: 'Italiano' },
	{ tag: 'nl-NL', label: 'Nederlands' },
	{ tag: 'pl-PL', label: 'Polski' },
	{ tag: 'pt-PT', label: 'Português' },
	{ tag: 'sv-SE', label: 'Svenska' },
]

const FALLBACK_LOCALE = 'en-GB'

const cache = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat>()
const resolved = new Map<string, string>()

/**
 * A tag `Intl` can actually parse.
 *
 * Systems hand out tags that look plausible but are not valid BCP 47 — glibc
 * reports `en-US@posix`, for one — and every formatter below would throw on
 * them, taking the whole page with it.
 */
export function normaliseLocale(tag: string): string {
	const known = resolved.get(tag)
	if (known !== undefined) return known

	let usable: string
	try {
		usable = new Intl.DateTimeFormat(tag).resolvedOptions().locale
	} catch {
		usable = FALLBACK_LOCALE
	}
	resolved.set(tag, usable)
	return usable
}

function dateFormat(tag: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
	const locale = normaliseLocale(tag)
	const key = `d:${locale}:${JSON.stringify(options)}`
	let formatter = cache.get(key) as Intl.DateTimeFormat | undefined
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(locale, options)
		cache.set(key, formatter)
	}
	return formatter
}

/** Short weekday of a given date, e.g. `Mo` / `Mon`. */
export function weekdayShort(locale: string, date: Date): string {
	return dateFormat(locale, { weekday: 'short' }).format(date)
}

/** Short month name, e.g. `Okt` / `Oct`. */
export function monthShort(locale: string, date: Date): string {
	return dateFormat(locale, { month: 'short' }).format(date)
}

/** Full month name for the grid heading. */
export function monthLong(locale: string, year: number, monthIndex: number): string {
	return dateFormat(locale, { month: 'long' }).format(new Date(year, monthIndex, 1))
}

/** The seven column headings, starting on Monday or Sunday. */
export function weekdayHeadings(locale: string, weekStartsOn: 0 | 1): string[] {
	// 2024-01-01 was a Monday, so day N of that January is weekday N-1.
	const firstOffset = weekStartsOn === 1 ? 0 : 6
	return Array.from({ length: 7 }, (_, index) =>
		weekdayShort(locale, new Date(2024, 0, 1 + ((firstOffset + index) % 7))),
	)
}

/** Birth dates and event dates under the name, e.g. `16. Okt. 1963`. */
export function formatFullDate(locale: string, date: Date): string {
	return dateFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

/** Same without the year, for events where the year adds nothing. */
export function formatDayMonth(locale: string, date: Date): string {
	return dateFormat(locale, { day: '2-digit', month: 'short' }).format(date)
}

/** The countdown on upcoming events: `9 Tage` / `9 days` / `9 jours`. */
export function formatDayCount(tag: string, days: number): string {
	const locale = normaliseLocale(tag)
	const key = `n:${locale}`
	let formatter = cache.get(key) as Intl.NumberFormat | undefined
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, {
			style: 'unit',
			unit: 'day',
			unitDisplay: 'long',
		})
		cache.set(key, formatter)
	}
	return formatter.format(days)
}

/** "heute" / "today" / "aujourd'hui", for an event happening on this page. */
export function formatToday(tag: string): string {
	return new Intl.RelativeTimeFormat(normaliseLocale(tag), { numeric: 'auto' }).format(0, 'day')
}
