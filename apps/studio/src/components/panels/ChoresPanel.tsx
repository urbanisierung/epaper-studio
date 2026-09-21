import { CheckList, Plus, Trash } from '@cascivo/icons'
import {
	Badge,
	Button,
	EmptyState,
	Field,
	Flex,
	IconButton,
	Input,
	NativeSelect,
	TagsInput,
	Text,
} from '@cascivo/react'
import { useMemo, useState } from 'react'
import { addDays, isValidDate, parseDate, startOfDay } from '../../lib/date'
import type { Translate } from '../../lib/i18n'
import { useT } from '../../lib/i18n/useT'
import { isDueOn, personFor } from '../../lib/render/chores'
import { formatFullDate } from '../../lib/render/locale'
import { useStudio } from '../../lib/state/store'
import { CHORE_FREQUENCIES, type Chore, type ChoreFrequency } from '../../lib/types'
import { DataTransferBar } from '../DataTransferBar'
import { Section } from '../ui/controls'

/** A year is far enough to find the next turn of anything monthly or shorter. */
const SEARCH_DAYS = 366

export function ChoresPanel({
	onError,
	onNotice,
}: {
	onError: (message: string) => void
	onNotice: (message: string) => void
}) {
	const t = useT()
	const project = useStudio((state) => state.project)
	const addChore = useStudio((state) => state.addChore)
	const updateChore = useStudio((state) => state.updateChore)
	const removeChore = useStudio((state) => state.removeChore)

	const [draft, setDraft] = useState<{
		name: string
		people: string[]
		frequency: ChoreFrequency
		startDate: string
	}>({ name: '', people: [], frequency: 'weekly', startDate: '' })

	const locale = project.settings.locale
	const today = startOfDay(new Date())

	const canAdd = draft.name.trim() !== '' && isValidDate(parseDate(draft.startDate))

	const submit = () => {
		if (!canAdd) return
		addChore({
			name: draft.name.trim(),
			people: draft.people.map((person) => person.trim()).filter(Boolean),
			frequency: draft.frequency,
			startDate: draft.startDate,
		})
		setDraft({ name: '', people: [], frequency: 'weekly', startDate: '' })
	}

	const frequencyOptions = useMemo(
		() => CHORE_FREQUENCIES.map((value) => ({ value, label: t(`frequency.${value}`) })),
		[t],
	)

	return (
		<Flex gap={4}>
			<Section
				index={1}
				eyebrow={t('chores.eyebrow')}
				title={t('chores.add.title')}
				description={t('chores.add.description')}
			>
				<Flex gap={3}>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'minmax(0, 1fr) 12rem auto',
							alignItems: 'end',
							gap: 'var(--cascivo-space-2)',
						}}
					>
						<Field label={t('field.name')}>
							<Input
								value={draft.name}
								placeholder={t('chores.namePlaceholder')}
								onChange={(event) => setDraft({ ...draft, name: event.target.value })}
								onKeyDown={(event) => event.key === 'Enter' && submit()}
							/>
						</Field>
						<Field label={t('chores.frequency')}>
							<NativeSelect
								value={draft.frequency}
								options={frequencyOptions}
								onChange={(event) =>
									setDraft({ ...draft, frequency: event.target.value as ChoreFrequency })
								}
							/>
						</Field>
						<Field label={t('chores.firstDay')}>
							<Input
								type="date"
								value={draft.startDate}
								onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
								onKeyDown={(event) => event.key === 'Enter' && submit()}
							/>
						</Field>
					</div>

					<Field label={t('chores.people')} hint={t('chores.people.hint')}>
						<TagsInput
							value={draft.people}
							placeholder={t('chores.people.placeholder')}
							onValueChange={(people) => setDraft({ ...draft, people })}
						/>
					</Field>

					<Flex direction="horizontal" justify="end">
						<Button disabled={!canAdd} onClick={submit}>
							<Plus size={16} />
							{t('action.add')}
						</Button>
					</Flex>
				</Flex>
			</Section>

			<Section
				index={2}
				eyebrow={t('chores.eyebrow')}
				title={t('chores.list.title', { count: project.chores.length })}
				description={t('chores.list.description')}
				action={<DataTransferBar subject="chores" onError={onError} onNotice={onNotice} />}
			>
				{project.chores.length === 0 ? (
					<EmptyState
						icon={<CheckList size={24} />}
						title={t('chores.list.title', { count: 0 })}
						description={t('chores.empty')}
					/>
				) : (
					<div className="epaper-list">
						{project.chores.map((chore) => (
							<div key={chore.id} className="epaper-row epaper-row--chore">
								<Flex gap={1}>
									<Input
										size="sm"
										value={chore.name}
										ariaLabel={t('field.name')}
										onChange={(event) => updateChore(chore.id, { name: event.target.value })}
									/>
									<Text size="sm" muted>
										{nextTurn(t, chore, today, locale)}
									</Text>
								</Flex>
								<div style={{ inlineSize: '11rem' }}>
									<NativeSelect
										size="sm"
										value={chore.frequency}
										aria-label={t('chores.frequency')}
										options={frequencyOptions}
										onChange={(event) =>
											updateChore(chore.id, { frequency: event.target.value as ChoreFrequency })
										}
									/>
								</div>
								<Badge variant={chore.people.length === 0 ? 'neutral' : 'info'}>
									{chore.people.length === 0 ? t('chores.nobody') : chore.people.join(' → ')}
								</Badge>
								<IconButton
									label={t('action.remove')}
									variant="ghost"
									size="sm"
									icon={<Trash size={16} />}
									onClick={() => removeChore(chore.id)}
								/>
							</div>
						))}
					</div>
				)}
			</Section>
		</Flex>
	)
}

/**
 * The next day this chore comes round, and whose turn it is then.
 *
 * Walked day by day rather than solved, because the rules differ per frequency
 * and a year of days is nothing to step through.
 */
function nextTurn(t: Translate, chore: Chore, today: Date, locale: string): string {
	for (let offset = 0; offset < SEARCH_DAYS; offset++) {
		const day = addDays(today, offset)
		if (!isDueOn(chore, day)) continue
		const date = formatFullDate(locale, day)
		const person = personFor(chore, day)
		return person
			? t('chores.nextTurn', { date, person })
			: t('chores.nextTurnUnassigned', { date })
	}
	return t('chores.noneDue')
}
