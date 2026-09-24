import { Component, type ReactNode } from 'react'
import { translate } from '../lib/i18n'
import { useStudio } from '../lib/state/store'

interface Props {
	children: ReactNode
}

interface State {
	error: unknown
}

/**
 * Without a boundary, React 19 unmounts the whole tree on an uncaught error and
 * leaves a white window with nothing to go on. This shows the error instead.
 */
export class CrashScreen extends Component<Props, State> {
	state: State = { error: null }

	static getDerivedStateFromError(error: unknown): State {
		return { error }
	}

	render() {
		const { error } = this.state
		if (error === null) return this.props.children

		const language = useStudio.getState().project.settings.uiLanguage
		const detail = error instanceof Error ? (error.stack ?? error.message) : String(error)
		return (
			<main className="epaper-crash">
				<h1>{translate(language, 'app.crashed')}</h1>
				<p>{translate(language, 'app.crashedHint')}</p>
				<pre>{detail}</pre>
			</main>
		)
	}
}
