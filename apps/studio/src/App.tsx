import {
	Calendar,
	CheckList,
	Download,
	FolderOpen,
	Gift,
	Image,
	Monitor,
	Moon,
	PaintCan,
	Plane,
	Save,
	Sun,
} from '@cascivo/icons'
import {
	Alert,
	AppShell,
	applyTheme,
	Button,
	Dropdown,
	Flex,
	IconButton,
	SegmentedControl,
	ShellHeader,
	SideNav,
} from '@cascivo/react'
import { useEffect, useState } from 'react'
import { AuthorCredit } from './components/AuthorCredit'
import { DataTransferBar } from './components/DataTransferBar'
import { PreviewPane } from './components/PreviewPane'
import { BirthdaysPanel } from './components/panels/BirthdaysPanel'
import { ChoresPanel } from './components/panels/ChoresPanel'
import { DevicePanel } from './components/panels/DevicePanel'
import { EventsPanel } from './components/panels/EventsPanel'
import { ExportPanel } from './components/panels/ExportPanel'
import { PhotosPanel } from './components/panels/PhotosPanel'
import { SetupPanel } from './components/panels/SetupPanel'
import { LANGUAGES, type MessageKey } from './lib/i18n'
import { useT } from './lib/i18n/useT'
import { open, save } from './lib/io/host'
import { parseProject, serialiseProject } from './lib/io/project'
import { readTextFile, writeTextFile } from './lib/io/tauri'
import { startAutosave, useStudio } from './lib/state/store'
import { THEMES, type ThemeSetting, useResolvedTheme } from './lib/theme'

const TABS = [
	{ id: 'setup', label: 'nav.setup', icon: Calendar },
	{ id: 'birthdays', label: 'nav.birthdays', icon: Gift },
	{ id: 'events', label: 'nav.events', icon: Plane },
	{ id: 'chores', label: 'nav.chores', icon: CheckList },
	{ id: 'photos', label: 'nav.photos', icon: Image },
	{ id: 'export', label: 'nav.export', icon: Download },
	{ id: 'device', label: 'nav.device', icon: Monitor },
] as const satisfies readonly { id: string; label: MessageKey; icon: unknown }[]

type TabId = (typeof TABS)[number]['id']

interface Banner {
	tone: 'error' | 'info'
	message: string
}

export default function App() {
	const [tab, setTab] = useState<TabId>('setup')
	const [banner, setBanner] = useState<Banner | null>(null)
	const t = useT()
	const hydrate = useStudio((state) => state.hydrate)
	const hydrated = useStudio((state) => state.hydrated)
	const project = useStudio((state) => state.project)
	const patchSettings = useStudio((state) => state.patchSettings)
	const replaceProject = useStudio((state) => state.replaceProject)
	const theme = useResolvedTheme(project.settings.theme)

	useEffect(() => {
		hydrate()
		return startAutosave()
	}, [hydrate])

	/*
	 * The project file owns the theme, so the attribute is written imperatively
	 * rather than through a controlled `ThemeProvider` — which, outside SSR,
	 * only adds an inline script React warns about. `index.html` carries the
	 * starting theme so the first paint is never unstyled.
	 */
	useEffect(() => {
		applyTheme(theme)
	}, [theme])

	// Screen readers and the browser's own text handling follow the app language.
	useEffect(() => {
		document.documentElement.lang = project.settings.uiLanguage
	}, [project.settings.uiLanguage])

	const showError = (message: string) => setBanner({ tone: 'error', message })
	const showNotice = (message: string) => setBanner({ tone: 'info', message })

	const openProject = async () => {
		try {
			const picked = await open({
				multiple: false,
				directory: false,
				title: t('project.openDialog'),
				filters: [{ name: t('project.fileType'), extensions: ['json'] }],
			})
			if (typeof picked !== 'string') return
			replaceProject(parseProject(await readTextFile(picked)))
		} catch (cause) {
			showError(String(cause))
		}
	}

	const saveProjectAs = async () => {
		try {
			const path = await save({
				title: t('project.saveDialog'),
				defaultPath: 'epaper-studio-project.json',
				filters: [{ name: t('project.fileType'), extensions: ['json'] }],
			})
			if (!path) return
			await writeTextFile(path, serialiseProject(project))
		} catch (cause) {
			showError(String(cause))
		}
	}

	if (!hydrated) {
		return (
			<Flex align="center" justify="center" style={{ blockSize: '100%' }}>
				<span className="epaper-eyebrow">{t('app.loading')}</span>
			</Flex>
		)
	}

	const header = (
		<ShellHeader
			brand={{ prefix: 'E-Paper', name: 'Studio' }}
			end={
				<Flex direction="horizontal" align="center" gap={2}>
					<SegmentedControl
						size="sm"
						ariaLabel={t('app.language')}
						value={project.settings.uiLanguage}
						onValueChange={(value) => patchSettings({ uiLanguage: value === 'de' ? 'de' : 'en' })}
						options={LANGUAGES.map((language) => ({
							value: language.code,
							label: language.code.toUpperCase(),
						}))}
					/>

					<Dropdown
						placement="bottom-end"
						trigger={
							<IconButton
								label={t('app.theme')}
								variant="ghost"
								size="sm"
								icon={themeIcon(project.settings.theme)}
							/>
						}
						onSelect={(value) => patchSettings({ theme: value as ThemeSetting })}
						items={[
							{ value: 'system', label: t('theme.system'), icon: <Monitor size={16} /> },
							{ kind: 'separator' },
							...THEMES.map((name) => ({ value: name, label: themeLabel(name) })),
						]}
					/>

					<DataTransferBar onError={showError} onNotice={showNotice} />

					<Button
						variant="secondary"
						size="sm"
						onClick={openProject}
						title={t('project.openTitle')}
					>
						<FolderOpen size={16} />
						{t('project.open')}
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onClick={saveProjectAs}
						title={t('project.saveTitle')}
					>
						<Save size={16} />
						{t('project.save')}
					</Button>
				</Flex>
			}
		/>
	)

	const nav = (
		<SideNav
			ariaLabel={t('app.name')}
			showCollapseToggle={false}
			footer={({ collapsed }) => <AuthorCredit showLabel={!collapsed} />}
			items={TABS.map(({ id, label, icon: Icon }) => ({
				id,
				label: t(label),
				icon: <Icon size={18} />,
				active: tab === id,
				onClick: (event) => {
					event.preventDefault()
					setTab(id)
				},
			}))}
		/>
	)

	return (
		<AppShell header={header} nav={nav}>
			<div className="epaper-workspace">
				<div className="epaper-panel">
					<Flex gap={4}>
						{banner && (
							<Alert
								variant={banner.tone === 'error' ? 'destructive' : 'info'}
								dismissible
								onDismiss={() => setBanner(null)}
							>
								{banner.message}
							</Alert>
						)}
						{tab === 'setup' && <SetupPanel />}
						{tab === 'birthdays' && <BirthdaysPanel />}
						{tab === 'events' && <EventsPanel />}
						{tab === 'chores' && <ChoresPanel />}
						{tab === 'photos' && <PhotosPanel onError={showError} />}
						{tab === 'export' && <ExportPanel onError={showError} />}
						{tab === 'device' && <DevicePanel onError={showError} />}
					</Flex>
				</div>

				<PreviewPane />
			</div>
		</AppShell>
	)
}

/** Theme names are proper nouns, so they are capitalised rather than translated. */
function themeLabel(name: string): string {
	return name.charAt(0).toUpperCase() + name.slice(1)
}

function themeIcon(setting: ThemeSetting) {
	if (setting === 'system') return <Monitor size={16} />
	if (setting === 'light') return <Sun size={16} />
	if (setting === 'dark' || setting === 'midnight') return <Moon size={16} />
	return <PaintCan size={16} />
}
