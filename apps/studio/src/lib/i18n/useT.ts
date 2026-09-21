import { useMemo } from 'react'
import { useStudio } from '../state/store'
import { type Translate, translator } from './index'

/**
 * The translator for the language the app is currently in.
 *
 * It reads from the same store the rest of the UI does, so switching language
 * re-renders every component that uses it — no provider to thread through.
 */
export function useT(): Translate {
	const language = useStudio((state) => state.project.settings.uiLanguage)
	return useMemo(() => translator(language), [language])
}
