import {
	Button,
	Field,
	Flex,
	Grid,
	Input,
	NativeSelect,
	NumberInput,
	Text,
	Toggle,
} from '@cascivo/react'
import { FONT_FAMILIES } from '../../lib/defaults'
import type { MessageKey } from '../../lib/i18n'
import { useT } from '../../lib/i18n/useT'
import { LOCALES } from '../../lib/render/locale'
import { buildSchedule } from '../../lib/render/schedule'
import { useStudio } from '../../lib/state/store'
import { ACCENT_COLORS, type AccentColor, DEVICE_PRESETS, PALETTE } from '../../lib/types'
import { Section } from '../ui/controls'

const COLOR_LABELS: Record<AccentColor, MessageKey> = {
	red: 'color.red',
	orange: 'color.orange',
	green: 'color.green',
	blue: 'color.blue',
	black: 'color.black',
}

export function SetupPanel() {
	const t = useT()
	const project = useStudio((state) => state.project)
	const patch = useStudio((state) => state.patchSettings)
	const settings = project.settings
	const pages = buildSchedule(project).length
	const activePreset = DEVICE_PRESETS.find(
		(preset) => preset.width === settings.width && preset.height === settings.height,
	)

	return (
		<Flex gap={4}>
			<Section
				index={1}
				eyebrow={t('setup.eyebrow')}
				title={t('setup.display.title')}
				description={t('setup.display.description')}
			>
				<Flex direction="horizontal" gap={2} wrap>
					{DEVICE_PRESETS.map((preset) => (
						<Button
							key={preset.id}
							variant={activePreset?.id === preset.id ? 'primary' : 'secondary'}
							size="sm"
							onClick={() => patch({ width: preset.width, height: preset.height })}
						>
							{preset.label}
						</Button>
					))}
				</Flex>
				<Grid
					cols={{ base: 1, sm: 2 }}
					gap={3}
					style={{ marginBlockStart: 'var(--cascivo-space-4)' }}
				>
					<Field label={t('setup.width')}>
						<NumberInput
							min={100}
							max={4000}
							value={settings.width}
							onValueChange={(value) => patch({ width: value ?? 480 })}
						/>
					</Field>
					<Field label={t('setup.height')}>
						<NumberInput
							min={100}
							max={4000}
							value={settings.height}
							onValueChange={(value) => patch({ height: value ?? 800 })}
						/>
					</Field>
				</Grid>
			</Section>

			<Section
				index={2}
				eyebrow={t('setup.eyebrow')}
				title={t('setup.range.title')}
				description={t('setup.range.description')}
			>
				<Grid cols={{ base: 1, sm: 2 }} gap={3}>
					<Field label={t('setup.firstDay')}>
						<Input
							type="date"
							value={settings.startDate}
							onChange={(event) => patch({ startDate: event.target.value })}
						/>
					</Field>
					<Field label={t('setup.days')} hint={t('setup.pages', { count: pages })}>
						<NumberInput
							min={1}
							max={400}
							value={settings.numberOfDays}
							onValueChange={(value) => patch({ numberOfDays: value ?? 1 })}
						/>
					</Field>
				</Grid>
				<div style={{ marginBlockStart: 'var(--cascivo-space-4)' }}>
					<Toggle
						label={t('setup.collapse.label')}
						checked={settings.collapseMultiDayEvents}
						onValueChange={(checked) => patch({ collapseMultiDayEvents: checked })}
					/>
					<Text size="sm" muted>
						{t('setup.collapse.hint')}
					</Text>
				</div>
			</Section>

			<Section
				index={3}
				eyebrow={t('setup.eyebrow')}
				title={t('setup.language.title')}
				description={t('setup.language.description')}
			>
				<Grid cols={{ base: 1, sm: 2 }} gap={3}>
					<Field label={t('setup.locale')}>
						<NativeSelect
							value={settings.locale}
							onChange={(event) => patch({ locale: event.target.value })}
							options={[
								...(LOCALES.some((locale) => locale.tag === settings.locale)
									? []
									: [{ value: settings.locale, label: settings.locale }]),
								...LOCALES.map((locale) => ({ value: locale.tag, label: locale.label })),
							]}
						/>
					</Field>
					<Field label={t('setup.weekStart')}>
						<NativeSelect
							value={String(settings.weekStartsOn)}
							onChange={(event) => patch({ weekStartsOn: event.target.value === '0' ? 0 : 1 })}
							options={[
								{ value: '1', label: t('setup.weekStart.monday') },
								{ value: '0', label: t('setup.weekStart.sunday') },
							]}
						/>
					</Field>
				</Grid>
			</Section>

			<Section
				index={4}
				eyebrow={t('setup.eyebrow')}
				title={t('setup.appearance.title')}
				description={t('setup.appearance.description')}
			>
				<Field label={t('setup.accent')}>
					<Flex direction="horizontal" gap={2}>
						{ACCENT_COLORS.map((color) => (
							<button
								key={color}
								type="button"
								className="epaper-swatch"
								title={t(COLOR_LABELS[color])}
								aria-label={t(COLOR_LABELS[color])}
								aria-pressed={settings.accentColor === color}
								onClick={() => patch({ accentColor: color })}
								style={{ background: PALETTE[color] }}
							/>
						))}
					</Flex>
				</Field>
				<Grid
					cols={{ base: 1, sm: 2 }}
					gap={3}
					style={{ marginBlockStart: 'var(--cascivo-space-4)' }}
				>
					<Field label={t('setup.font')}>
						<NativeSelect
							value={settings.fontFamily}
							onChange={(event) => patch({ fontFamily: event.target.value })}
							options={FONT_FAMILIES.map((family) => ({
								value: family,
								label: family === 'Inter' ? t('setup.font.bundled', { name: family }) : family,
							}))}
						/>
					</Field>
					<Field label={t('setup.maxEvents')}>
						<NumberInput
							min={1}
							max={10}
							value={settings.maxEvents}
							onValueChange={(value) => patch({ maxEvents: value ?? 4 })}
						/>
					</Field>
				</Grid>
				<Grid
					cols={{ base: 1, sm: 2 }}
					gap={3}
					style={{ marginBlockStart: 'var(--cascivo-space-4)' }}
				>
					<Field label={t('chores.maxOnPage')} hint={t('chores.maxOnPage.hint')}>
						<NumberInput
							min={0}
							max={6}
							value={settings.maxChores}
							onValueChange={(value) => patch({ maxChores: value ?? 0 })}
						/>
					</Field>
					<Field label={t('setup.lookahead')} hint={t('setup.lookahead.hint')}>
						<NumberInput
							min={1}
							max={365}
							value={settings.lookaheadDays}
							onValueChange={(value) => patch({ lookaheadDays: value ?? 30 })}
						/>
					</Field>
				</Grid>
				<Grid
					cols={{ base: 1, sm: 2 }}
					gap={3}
					style={{ marginBlockStart: 'var(--cascivo-space-4)' }}
				>
					<div style={{ alignSelf: 'center' }}>
						<Toggle
							label={t('setup.showAges')}
							checked={settings.showAges}
							onValueChange={(checked) => patch({ showAges: checked })}
						/>
					</div>
				</Grid>
			</Section>
		</Flex>
	)
}
