import { Download, Upload } from '@cascivo/icons'
import { Button, Dropdown, Flex, Modal, Text } from '@cascivo/react'
import { open, save } from '@tauri-apps/plugin-dialog'
import { useState } from 'react'
import type { Translate } from '../lib/i18n'
import { useT } from '../lib/i18n/useT'
import {
	type CalendarData,
	countOf,
	parseCalendarData,
	toCombinedCsv,
	toCombinedIcs,
	toCombinedJson,
} from '../lib/io/calendarData'
import { birthdaysToCsv, eventsToCsv } from '../lib/io/csv'
import { readTextFile, writeTextFile } from '../lib/io/tauri'
import { useStudio } from '../lib/state/store'

export interface DataTransferBarProps {
	/** Which list this bar sits on; decides how a typeless file is read. */
	subject: 'birthdays' | 'events' | 'chores'
	onError: (message: string) => void
	onNotice: (message: string) => void
}

/**
 * Import and export for birthdays and holidays.
 *
 * The two lists are kept apart in the app but belong together on disk: one
 * file holds both, so a backup, a hand-over or a move to another machine is a
 * single file rather than two that have to be kept in step. Each list can
 * still be exported on its own for a spreadsheet.
 */
export function DataTransferBar({ subject, onError, onNotice }: DataTransferBarProps) {
	const t = useT()
	const project = useStudio((state) => state.project)
	const mergeBirthdays = useStudio((state) => state.mergeBirthdays)
	const mergeEvents = useStudio((state) => state.mergeEvents)
	const mergeChores = useStudio((state) => state.mergeChores)
	const [pending, setPending] = useState<CalendarData | null>(null)

	const handleImport = async () => {
		try {
			const picked = await open({
				multiple: false,
				directory: false,
				title: t('io.importDialog'),
				filters: [
					{ name: t('io.filter.any'), extensions: ['json', 'csv', 'ics', 'txt'] },
					{ name: t('io.filter.all'), extensions: ['*'] },
				],
			})
			if (typeof picked !== 'string') return

			const data = parseCalendarData(await readTextFile(picked), picked, subject)
			if (countOf(data) === 0) {
				onError(t('io.nothingFound'))
				return
			}
			setPending(data)
		} catch (error) {
			onError(String(error))
		}
	}

	/**
	 * Only the lists the file actually carried are touched: replacing from a
	 * file of birthdays must not quietly empty the holidays.
	 */
	const applyImport = (mode: 'append' | 'replace') => {
		if (!pending) return
		if (pending.birthdays.length > 0) mergeBirthdays(pending.birthdays, mode)
		if (pending.events.length > 0) mergeEvents(pending.events, mode)
		if (pending.chores.length > 0) mergeChores(pending.chores, mode)
		onNotice(t('io.imported', { summary: summarise(t, pending) }))
		setPending(null)
	}

	const exportTo = async (name: string, extension: string, build: () => string) => {
		try {
			const path = await save({
				title: t('io.exportDialog'),
				defaultPath: `${name}.${extension}`,
				filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
			})
			if (!path) return
			await writeTextFile(path, build())
		} catch (error) {
			onError(String(error))
		}
	}

	const all: CalendarData = {
		birthdays: project.birthdays,
		events: project.events,
		chores: project.chores,
	}
	const only = (part: Partial<CalendarData>): CalendarData => ({
		birthdays: [],
		events: [],
		chores: [],
		...part,
	})

	const exporters: Record<string, () => void> = {
		'all.json': () => exportTo('calendar-data', 'json', () => toCombinedJson(all)),
		'all.csv': () => exportTo('calendar-data', 'csv', () => toCombinedCsv(all)),
		'all.ics': () => exportTo('calendar-data', 'ics', () => toCombinedIcs(all)),
		'birthdays.csv': () => exportTo('birthdays', 'csv', () => birthdaysToCsv(project.birthdays)),
		'birthdays.json': () =>
			exportTo('birthdays', 'json', () => toCombinedJson(only({ birthdays: project.birthdays }))),
		'events.csv': () => exportTo('holidays', 'csv', () => eventsToCsv(project.events)),
		'events.json': () =>
			exportTo('holidays', 'json', () => toCombinedJson(only({ events: project.events }))),
		'chores.csv': () =>
			exportTo('chores', 'csv', () => toCombinedCsv(only({ chores: project.chores }))),
		'chores.json': () =>
			exportTo('chores', 'json', () => toCombinedJson(only({ chores: project.chores }))),
	}

	return (
		<>
			<Flex direction="horizontal" gap={2} wrap>
				<Button variant="secondary" size="sm" onClick={handleImport}>
					<Upload size={16} />
					{t('io.import')}
				</Button>
				<Dropdown
					placement="bottom-end"
					trigger={
						<Button variant="secondary" size="sm">
							<Download size={16} />
							{t('io.export.menu')}
						</Button>
					}
					onSelect={(value) => exporters[value]?.()}
					items={[
						{ value: 'all.json', label: t('io.export.allJson') },
						{ value: 'all.csv', label: t('io.export.allCsv') },
						{ value: 'all.ics', label: t('io.export.allIcs') },
						{ kind: 'separator' },
						{ value: 'birthdays.csv', label: t('io.export.birthdaysCsv') },
						{ value: 'birthdays.json', label: t('io.export.birthdaysJson') },
						{ kind: 'separator' },
						{ value: 'events.csv', label: t('io.export.eventsCsv') },
						{ value: 'events.json', label: t('io.export.eventsJson') },
						{ kind: 'separator' },
						{ value: 'chores.csv', label: t('io.export.choresCsv') },
						{ value: 'chores.json', label: t('io.export.choresJson') },
					]}
				/>
			</Flex>

			<Modal
				open={pending !== null}
				onClose={() => setPending(null)}
				size="sm"
				title={pending ? t('io.merge.title', { summary: summarise(t, pending) }) : ''}
				description={t('io.merge.question')}
				footer={
					<>
						<Button variant="ghost" onClick={() => setPending(null)}>
							{t('action.cancel')}
						</Button>
						<Button variant="secondary" onClick={() => applyImport('replace')}>
							{t('io.merge.replace')}
						</Button>
						<Button onClick={() => applyImport('append')}>{t('io.merge.append')}</Button>
					</>
				}
			>
				<Text size="sm" muted>
					{t('io.merge.current', { summary: summarise(t, all) })}
				</Text>
			</Modal>
		</>
	)
}

/** "3 birthdays and 1 holiday", leaving out whichever side is empty. */
function summarise(t: Translate, data: CalendarData): string {
	const parts: string[] = []
	if (data.birthdays.length > 0) {
		parts.push(t('io.summary.birthdays', { count: data.birthdays.length }))
	}
	if (data.events.length > 0) {
		parts.push(t('io.summary.events', { count: data.events.length }))
	}
	if (data.chores.length > 0) {
		parts.push(t('io.summary.chores', { count: data.chores.length }))
	}
	if (parts.length === 0) return t('io.summary.none')
	// "a, b and c" — the last two join with the translated conjunction.
	const last = parts.pop() as string
	return parts.length === 0 ? last : t('io.summary.and', { first: parts.join(', '), second: last })
}
