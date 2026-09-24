import { Link } from '@cascivo/react'
import type { MouseEvent } from 'react'
import { useT } from '../lib/i18n/useT'
import { openUrl } from '../lib/io/host'

export const AUTHOR_NAME = 'u11g.com'
export const AUTHOR_URL = 'https://u11g.com'

/**
 * Who made this.
 *
 * A webview has nowhere to put a new tab, so the click is handed to the OS
 * browser. The element stays a real anchor, so it still reads as a link to a
 * screen reader and its address can be copied from the context menu.
 */
export function AuthorCredit({ showLabel = true }: { showLabel?: boolean }) {
	const t = useT()

	const open = (event: MouseEvent) => {
		event.preventDefault()
		openUrl(AUTHOR_URL).catch(() => undefined)
	}

	const link = (
		<Link
			href={AUTHOR_URL}
			size="sm"
			external
			onClick={open}
			title={t('app.authorTitle', { name: AUTHOR_NAME })}
		>
			{AUTHOR_NAME}
		</Link>
	)

	if (!showLabel) return link

	return (
		<span className="epaper-eyebrow">
			{t('app.builtBy')} {link}
		</span>
	)
}
