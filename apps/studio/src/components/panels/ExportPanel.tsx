import { FolderOpen, PlayCircle } from '@cascivo/icons'
import {
	Alert,
	Button,
	Field,
	Flex,
	Grid,
	LogViewer,
	NativeSelect,
	ProgressBar,
	Text,
	Toggle,
} from '@cascivo/react'
import { useState } from 'react'
import {
	type ExportProgress,
	generate,
	type LogLine,
	plannedPictureCount,
	RECOMMENDED_MAX_PICTURES,
} from '../../lib/export'
import { useT } from '../../lib/i18n/useT'
import { open, openPath } from '../../lib/io/host'
import { buildSchedule } from '../../lib/render/schedule'
import { useStudio } from '../../lib/state/store'
import { Section } from '../ui/controls'

export function ExportPanel({ onError }: { onError: (message: string) => void }) {
	const t = useT()
	const project = useStudio((state) => state.project)
	const patch = useStudio((state) => state.patchExportSettings)
	const settings = project.exportSettings
	// Read out once so the callback below keeps the narrowing the JSX guard does.
	const outputDir = settings.outputDir

	const [progress, setProgress] = useState<ExportProgress | null>(null)
	const [log, setLog] = useState<LogLine[]>([])
	const [finished, setFinished] = useState<string | null>(null)

	const planned = plannedPictureCount(project)
	const pages = buildSchedule(project).length
	const busy = progress !== null
	const tooMany = planned > RECOMMENDED_MAX_PICTURES

	const chooseFolder = async () => {
		try {
			const picked = await open({
				directory: true,
				multiple: false,
				title: t('export.chooseFolderDialog'),
			})
			if (typeof picked === 'string') patch({ outputDir: picked })
		} catch (error) {
			onError(String(error))
		}
	}

	const run = async () => {
		setLog([])
		setFinished(null)
		setProgress({ done: 0, total: planned, label: t('export.starting') })
		try {
			const summary = await generate(project, setProgress, (line) =>
				setLog((lines) => [...lines, line]),
			)
			setFinished(t('export.done', { count: summary.pictures, path: summary.fileListPath }))
		} catch (error) {
			setLog((lines) => [...lines, { kind: 'error', message: String(error) }])
			onError(String(error))
		} finally {
			setProgress(null)
		}
	}

	return (
		<Flex gap={4}>
			<Section
				index={1}
				eyebrow={t('export.eyebrow')}
				title={t('export.where.title')}
				description={t('export.where.description')}
			>
				<Flex direction="horizontal" align="center" gap={3}>
					<Button variant="secondary" onClick={chooseFolder} disabled={busy}>
						<FolderOpen size={16} />
						{t('export.chooseFolder')}
					</Button>
					<span className="epaper-mono epaper-truncate" title={settings.outputDir ?? ''}>
						{settings.outputDir ?? t('export.noFolder')}
					</span>
				</Flex>
				<div style={{ marginBlockStart: 'var(--cascivo-space-4)' }}>
					<Toggle
						label={t('export.clear.label')}
						checked={settings.clearBeforeWrite}
						onValueChange={(checked) => patch({ clearBeforeWrite: checked })}
						disabled={busy}
					/>
					<Text size="sm" muted>
						{t('export.clear.hint')}
					</Text>
				</div>
			</Section>

			<Section index={2} eyebrow={t('export.eyebrow')} title={t('export.what.title')}>
				<Grid cols={{ base: 1, sm: 2 }} gap={3}>
					<Field label={t('export.contents')}>
						<NativeSelect
							value={settings.content}
							disabled={busy}
							onChange={(event) =>
								patch({ content: event.target.value as typeof settings.content })
							}
							options={[
								{ value: 'calendar', label: t('export.contents.calendar', { count: pages }) },
								{
									value: 'photos',
									label: t('export.contents.photos', { count: project.photos.length }),
								},
								{
									value: 'both',
									label: t('export.contents.both', { count: pages + project.photos.length }),
								},
							]}
						/>
					</Field>
					<Field label={t('export.placement')}>
						<NativeSelect
							value={settings.photoPlacement}
							disabled={busy || settings.content !== 'both'}
							onChange={(event) =>
								patch({ photoPlacement: event.target.value as typeof settings.photoPlacement })
							}
							options={[
								{ value: 'append', label: t('export.placement.append') },
								{ value: 'interleave', label: t('export.placement.interleave') },
							]}
						/>
					</Field>
				</Grid>

				{tooMany && (
					<div style={{ marginBlockStart: 'var(--cascivo-space-4)' }}>
						<Alert variant="warning">
							{t('export.tooMany', { count: planned, max: RECOMMENDED_MAX_PICTURES })}
						</Alert>
					</div>
				)}
			</Section>

			<Section index={3} eyebrow={t('export.eyebrow')} title={t('export.generate.title')}>
				<Flex direction="horizontal" align="center" gap={3}>
					<Button
						disabled={busy || !settings.outputDir || planned === 0}
						loading={busy}
						onClick={run}
					>
						<PlayCircle size={16} />
						{busy ? t('export.working') : t('export.run', { count: planned })}
					</Button>
					{outputDir && !busy && (
						<Button variant="secondary" onClick={() => openPath(outputDir).catch(() => undefined)}>
							{t('export.openFolder')}
						</Button>
					)}
				</Flex>

				{progress && (
					<div style={{ marginBlockStart: 'var(--cascivo-space-4)' }}>
						<ProgressBar
							value={progress.done}
							max={Math.max(1, progress.total)}
							helperText={t('export.progress', {
								done: progress.done,
								total: progress.total,
								label: progress.label,
							})}
						/>
					</div>
				)}

				{finished && !busy && (
					<div style={{ marginBlockStart: 'var(--cascivo-space-4)' }}>
						<Alert variant="success">{finished}</Alert>
					</div>
				)}

				{log.length > 0 && (
					<div style={{ marginBlockStart: 'var(--cascivo-space-3)' }}>
						<LogViewer
							maxHeight="12rem"
							lines={log.map((line, index) => ({
								id: index,
								text: line.message,
								level: line.kind === 'error' ? ('error' as const) : ('info' as const),
							}))}
						/>
					</div>
				)}
			</Section>
		</Flex>
	)
}
