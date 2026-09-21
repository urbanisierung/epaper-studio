import { Card, CardContent, CardHeader, CardTitle, Text } from '@cascivo/react'
import type { ReactNode } from 'react'

/**
 * The two compositions this app repeats.
 *
 * Everything else comes straight from `@cascivo/react` — these exist because a
 * numbered section header is an app decision, not a missing component.
 */

/** The monospaced signpost above a block — `01 / SETUP`. */
export function Eyebrow({ index, children }: { index?: number; children: ReactNode }) {
	return (
		<p className="epaper-eyebrow">
			{index !== undefined && `${String(index).padStart(2, '0')} / `}
			{children}
		</p>
	)
}

export function Section({
	index,
	eyebrow,
	title,
	description,
	action,
	children,
}: {
	/** Step number shown in the eyebrow, so a panel reads as a sequence. */
	index?: number
	eyebrow?: string
	title: string
	description?: string
	action?: ReactNode
	children: ReactNode
}) {
	return (
		<Card variant="outlined">
			<CardHeader actions={action}>
				{(eyebrow || index !== undefined) && <Eyebrow index={index}>{eyebrow ?? title}</Eyebrow>}
				<CardTitle>{title}</CardTitle>
				{description && (
					<Text size="sm" muted>
						{description}
					</Text>
				)}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	)
}
