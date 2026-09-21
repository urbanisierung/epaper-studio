import { Gift, Plus, Trash } from '@cascivo/icons'
import { Badge, Button, EmptyState, Field, Flex, IconButton, Input, Search } from '@cascivo/react'
import { useMemo, useState } from 'react'
import { daysBetween, isValidDate, nextOccurrence, parseDate, startOfDay } from '../../lib/date'
import { useT } from '../../lib/i18n/useT'
import { formatFullDate } from '../../lib/render/locale'
import { useStudio } from '../../lib/state/store'
import { DataTransferBar } from '../DataTransferBar'
import { Section } from '../ui/controls'

export function BirthdaysPanel({
	onError,
	onNotice,
}: {
	onError: (message: string) => void
	onNotice: (message: string) => void
}) {
	const t = useT()
	const project = useStudio((state) => state.project)
	const addBirthday = useStudio((state) => state.addBirthday)
	const updateBirthday = useStudio((state) => state.updateBirthday)
	const removeBirthday = useStudio((state) => state.removeBirthday)

	const [draft, setDraft] = useState({ name: '', date: '' })
	const [search, setSearch] = useState('')

	const locale = project.settings.locale
	const today = startOfDay(new Date())

	const sorted = useMemo(() => {
		const needle = search.trim().toLowerCase()
		return project.birthdays
			.filter((birthday) => !needle || birthday.name.toLowerCase().includes(needle))
			.map((birthday) => {
				const born = parseDate(birthday.date)
				return { birthday, born, inDays: daysBetween(today, nextOccurrence(born, today)) }
			})
			.sort((a, b) => a.inDays - b.inDays)
	}, [project.birthdays, search, today])

	const canAdd = draft.name.trim() !== '' && isValidDate(parseDate(draft.date))

	const submit = () => {
		if (!canAdd) return
		addBirthday({ name: draft.name.trim(), date: draft.date })
		setDraft({ name: '', date: '' })
	}

	return (
		<Flex gap={4}>
			<Section
				index={1}
				eyebrow={t('birthdays.eyebrow')}
				title={t('birthdays.add.title')}
				description={t('birthdays.add.description')}
			>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'minmax(0, 1fr) auto auto',
						alignItems: 'end',
						gap: 'var(--cascivo-space-2)',
					}}
				>
					<Field label={t('field.name')}>
						<Input
							value={draft.name}
							placeholder={t('birthdays.namePlaceholder')}
							onChange={(event) => setDraft({ ...draft, name: event.target.value })}
							onKeyDown={(event) => event.key === 'Enter' && submit()}
						/>
					</Field>
					<Field label={t('birthdays.dateOfBirth')}>
						<Input
							type="date"
							value={draft.date}
							onChange={(event) => setDraft({ ...draft, date: event.target.value })}
							onKeyDown={(event) => event.key === 'Enter' && submit()}
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
				eyebrow={t('birthdays.eyebrow')}
				title={t('birthdays.list.title', { count: project.birthdays.length })}
				description={t('birthdays.list.description')}
				action={<DataTransferBar subject="birthdays" onError={onError} onNotice={onNotice} />}
			>
				{project.birthdays.length > 6 && (
					<div style={{ marginBlockEnd: 'var(--cascivo-space-3)' }}>
						<Search
							value={search}
							placeholder={t('action.search')}
							onValueChange={setSearch}
							ariaLabel={t('action.search')}
						/>
					</div>
				)}

				{sorted.length === 0 ? (
					<EmptyState
						icon={<Gift size={24} />}
						title={t('birthdays.list.title', { count: 0 })}
						description={t('birthdays.empty')}
					/>
				) : (
					<div className="epaper-list">
						{sorted.map(({ birthday, born, inDays }) => (
							<div key={birthday.id} className="epaper-row epaper-row--birthday">
								<Input
									size="sm"
									value={birthday.name}
									ariaLabel={t('field.name')}
									onChange={(event) => updateBirthday(birthday.id, { name: event.target.value })}
								/>
								<span className="epaper-mono">{formatFullDate(locale, born)}</span>
								<Badge variant={inDays === 0 ? 'warning' : 'neutral'}>
									{inDays === 0 ? t('badge.today') : t('badge.inDays', { count: inDays })}
								</Badge>
								<IconButton
									label={t('action.remove')}
									variant="ghost"
									size="sm"
									icon={<Trash size={16} />}
									onClick={() => removeBirthday(birthday.id)}
								/>
							</div>
						))}
					</div>
				)}
			</Section>
		</Flex>
	)
}
