import { de } from './de'
import { en, type MessageKey } from './en'

export type { MessageKey }

export type Language = 'en' | 'de'

export interface LanguageOption {
	code: Language
	/** Written in the language itself, the way a language picker should read. */
	label: string
}

export const LANGUAGES: LanguageOption[] = [
	{ code: 'en', label: 'English' },
	{ code: 'de', label: 'Deutsch' },
]

const FALLBACK: Language = 'en'

const CATALOGS: Record<Language, Record<string, string>> = { en, de }

export type Vars = Record<string, string | number>

/**
 * The stem of a pair of plural messages: `setup.pages_one` / `setup.pages_other`
 * are addressed as `setup.pages`, with the form chosen from `count`.
 */
type StemOf<K> = K extends `${infer Base}_one` ? Base : never
export type PluralKey = StemOf<MessageKey>

/** Anything `t` will accept. */
export type AnyKey = MessageKey | PluralKey

/** A callable translator bound to one language. */
export type Translate = (key: AnyKey, vars?: Vars) => string

export function isLanguage(value: unknown): value is Language {
	return value === 'en' || value === 'de'
}

/** The app language to start in, taken from the browser/OS preference. */
export function detectLanguage(): Language {
	const preferred = typeof navigator === 'undefined' ? undefined : navigator.language
	return preferred?.toLowerCase().startsWith('de') ? 'de' : FALLBACK
}

const pluralCache = new Map<Language, Intl.PluralRules>()

function pluralCategory(language: Language, count: number): string {
	let rules = pluralCache.get(language)
	if (!rules) {
		rules = new Intl.PluralRules(language)
		pluralCache.set(language, rules)
	}
	return rules.select(count)
}

/**
 * Looks a message up, picking a plural form when a `count` is supplied and
 * falling back to English for anything a catalogue happens to be missing.
 */
export function translate(language: Language, key: AnyKey, vars?: Vars): string {
	const catalog = CATALOGS[language] ?? CATALOGS[FALLBACK]
	const fallback = CATALOGS[FALLBACK]

	let lookup: string = key
	if (typeof vars?.count === 'number') {
		const candidate = `${key}_${pluralCategory(language, vars.count)}`
		if (candidate in catalog || candidate in fallback) lookup = candidate
		else if (`${key}_other` in catalog || `${key}_other` in fallback) lookup = `${key}_other`
	}

	const template = catalog[lookup] ?? fallback[lookup] ?? catalog[key] ?? fallback[key] ?? key
	return vars ? interpolate(template, vars) : template
}

export function translator(language: Language): Translate {
	return (key, vars) => translate(language, key, vars)
}

/** Replaces `{name}` with `vars.name`; an unknown placeholder is left alone. */
function interpolate(template: string, vars: Vars): string {
	return template.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in vars ? String(vars[name]) : match,
	)
}
