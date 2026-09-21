import { Plane, Plus, Trash } from '@cascivo/icons'
import {
	Badge,
	Button,
	EmptyState,
	Field,
	Flex,
	IconButton,
	Input,
	NumberInput,
} from '@cascivo/react'
import { useMemo, useState } from 'react'
import { addDays, daysBetween, isValidDate, parseDate, startOfDay } from '../../lib/date'
import { useT } from '../../lib/i18n/useT'
import { formatDayMonth, formatFullDate } from '../../lib/render/locale'
import { useStudio } from '../../lib/state/store'
import { DataTransferBar } from '../DataTransferBar'
import { Section } from '../ui/controls'

export function EventsPanel({
	onError,
	onNotice,
}: {
	onError: (message: string) => void
	onNotice: (message: string) => void
}) {
	const t = useT()
	const project = useStudio((state) => state.project)
	const addEvent = useStudio((state) => state.addEvent)
	const updateEvent = useStudio((state) => state.updateEvent)
	const removeEvent = useStudio((state) => state.removeEvent)

	const [draft, setDraft] = useState({ name: '', date: '', duration: 1 })
	const locale = project.settings.locale
	const today = startOfDay(new Date())

	const sorted = useMemo(
		() =>
			[...project.events]
				.map((event) => ({ event, start: parseDate(event.date) }))
				.sort((a, b) => a.start.getTime() - b.start.getTime()),
		[project.events],
	)

	const canAdd = draft.name.trim() !== '' && isValidDate(parseDate(draft.date))

	const submit = () => {
		if (!canAdd) return
		addEvent({
			name: draft.name.trim(),
			date: draft.date,
			duration: Math.max(1, Math.round(draft.duration)),
		})
		setDraft({ name: '', date: '', duration: 1 })
	}

	return (
		<Flex gap={4}>
			<Section
				index={1}
				eyebrow={t('events.eyebrow')}
				title={t('events.add.title')}
				description={t('events.add.description')}
			>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'minmax(0, 1fr) auto 6.5rem auto',
						alignItems: 'end',
						gap: 'var(--cascivo-space-2)',
					}}
				>
					<Field label={t('field.name')}>
						<Input
							value={draft.name}
							placeholder={t('events.namePlaceholder')}
							onChange={(event) => setDraft({ ...draft, name: event.target.value })}
							onKeyDown={(event) => event.key === 'Enter' && submit()}
						/>
					</Field>
					<Field label={t('events.firstDay')}>
						<Input
							type="date"
							value={draft.date}
							onChange={(event) => setDraft({ ...draft, date: event.target.value })}
							onKeyDown={(event) => event.key === 'Enter' && submit()}
						/>
					</Field>
					<Field label={t('events.days')}>
						<NumberInput
							min={1}
							max={365}
							value={draft.duration}
							onValueChange={(value) => setDraft({ ...draft, duration: value ?? 1 })}
						/>
					</Field>
					<Button disabled={!canAdd} onClick={submit}>
						<Plus size={16} />
						{t('action.add')}
					</Button>
				</div>
			</Section>

			<Section
				index={2}
				eyebrow={t('events.eyebrow')}
				title={t('events.list.title', { count: project.events.length })}
				action={<DataTransferBar subject="events" onError={onError} onNotice={onNotice} />}
			>
				{sorted.length === 0 ? (
					<EmptyState
						icon={<Plane size={24} />}
						title={t('events.list.title', { count: 0 })}
						description={t('events.empty')}
					/>
				) : (
					<div className="epaper-list">
						{sorted.map(({ event, start }) => {
							const until = daysBetween(today, start)
							const last = addDays(start, Math.max(1, event.duration) - 1)
							return (
								<div key={event.id} className="epaper-row epaper-row--event">
									<Input
										size="sm"
										value={event.name}
										ariaLabel={t('field.name')}
										onChange={(changed) => updateEvent(event.id, { name: changed.target.value })}
									/>
									<span className="epaper-mono">
										{formatFullDate(locale, start)}
										{event.duration > 1 && ` – ${formatDayMonth(locale, last)}`}
									</span>
									<div style={{ inlineSize: '6rem' }}>
										<NumberInput
											size="sm"
											min={1}
											max={365}
											ariaLabel={t('events.days')}
											value={event.duration}
											onValueChange={(value) => updateEvent(event.id, { duration: value ?? 1 })}
										/>
									</div>
									<Badge variant={until === 0 ? 'warning' : 'neutral'}>
										{until < 0
											? t('badge.past')
											: until === 0
												? t('badge.today')
												: t('badge.inDays', { count: until })}
									</Badge>
									<IconButton
										label={t('action.remove')}
										variant="ghost"
										size="sm"
										icon={<Trash size={16} />}
										onClick={() => removeEvent(event.id)}
									/>
								</div>
							)
						})}
					</div>
				)}
			</Section>
		</Flex>
	)
}
