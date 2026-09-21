import { create } from 'zustand'
import { defaultProject, newId } from '../defaults'
import { parseProject, serialiseProject } from '../io/project'
import { loadStoredProject, saveStoredProject } from '../io/tauri'
import type {
	Birthday,
	Chore,
	ExportSettings,
	Photo,
	Project,
	Settings,
	SpecialEvent,
} from '../types'

export interface StudioState {
	project: Project
	/** False until the autosaved project has been read back. */
	hydrated: boolean
	/** Which page of the schedule the preview pane is showing. */
	previewIndex: number

	hydrate: () => Promise<void>
	replaceProject: (project: Project) => void
	patchSettings: (patch: Partial<Settings>) => void
	patchExportSettings: (patch: Partial<ExportSettings>) => void

	addBirthday: (birthday: Omit<Birthday, 'id'>) => void
	updateBirthday: (id: string, patch: Partial<Omit<Birthday, 'id'>>) => void
	removeBirthday: (id: string) => void
	mergeBirthdays: (birthdays: Birthday[], mode: MergeMode) => void

	addEvent: (event: Omit<SpecialEvent, 'id'>) => void
	updateEvent: (id: string, patch: Partial<Omit<SpecialEvent, 'id'>>) => void
	removeEvent: (id: string) => void
	mergeEvents: (events: SpecialEvent[], mode: MergeMode) => void

	addChore: (chore: Omit<Chore, 'id'>) => void
	updateChore: (id: string, patch: Partial<Omit<Chore, 'id'>>) => void
	removeChore: (id: string) => void
	mergeChores: (chores: Chore[], mode: MergeMode) => void

	addPhotos: (paths: string[]) => void
	updatePhoto: (id: string, patch: Partial<Omit<Photo, 'id'>>) => void
	removePhoto: (id: string) => void
	movePhoto: (id: string, direction: -1 | 1) => void

	setPreviewIndex: (index: number) => void
}

export type MergeMode = 'replace' | 'append'

export const useStudio = create<StudioState>((set) => ({
	project: defaultProject(),
	hydrated: false,
	previewIndex: 0,

	hydrate: async () => {
		try {
			const stored = await loadStoredProject()
			if (stored) set({ project: parseProject(stored) })
		} catch (error) {
			console.error('Could not read the saved project', error)
		} finally {
			set({ hydrated: true })
		}
	},

	replaceProject: (project) => set({ project, previewIndex: 0 }),

	patchSettings: (patch) =>
		set(({ project }) => ({
			project: { ...project, settings: { ...project.settings, ...patch } },
		})),

	patchExportSettings: (patch) =>
		set(({ project }) => ({
			project: { ...project, exportSettings: { ...project.exportSettings, ...patch } },
		})),

	addBirthday: (birthday) =>
		set(({ project }) => ({
			project: { ...project, birthdays: [...project.birthdays, { ...birthday, id: newId() }] },
		})),

	updateBirthday: (id, patch) =>
		set(({ project }) => ({
			project: { ...project, birthdays: patchById(project.birthdays, id, patch) },
		})),

	removeBirthday: (id) =>
		set(({ project }) => ({
			project: { ...project, birthdays: project.birthdays.filter((item) => item.id !== id) },
		})),

	mergeBirthdays: (birthdays, mode) =>
		set(({ project }) => ({
			project: {
				...project,
				birthdays: mode === 'replace' ? birthdays : [...project.birthdays, ...birthdays],
			},
		})),

	addEvent: (event) =>
		set(({ project }) => ({
			project: { ...project, events: [...project.events, { ...event, id: newId() }] },
		})),

	updateEvent: (id, patch) =>
		set(({ project }) => ({
			project: { ...project, events: patchById(project.events, id, patch) },
		})),

	removeEvent: (id) =>
		set(({ project }) => ({
			project: { ...project, events: project.events.filter((item) => item.id !== id) },
		})),

	mergeEvents: (events, mode) =>
		set(({ project }) => ({
			project: {
				...project,
				events: mode === 'replace' ? events : [...project.events, ...events],
			},
		})),

	addChore: (chore) =>
		set(({ project }) => ({
			project: { ...project, chores: [...project.chores, { ...chore, id: newId() }] },
		})),

	updateChore: (id, patch) =>
		set(({ project }) => ({
			project: { ...project, chores: patchById(project.chores, id, patch) },
		})),

	removeChore: (id) =>
		set(({ project }) => ({
			project: { ...project, chores: project.chores.filter((item) => item.id !== id) },
		})),

	mergeChores: (chores, mode) =>
		set(({ project }) => ({
			project: {
				...project,
				chores: mode === 'replace' ? chores : [...project.chores, ...chores],
			},
		})),

	addPhotos: (paths) =>
		set(({ project }) => {
			const known = new Set(project.photos.map((photo) => photo.path))
			const added = paths
				.filter((path) => !known.has(path))
				.map<Photo>((path) => ({
					id: newId(),
					path,
					name: path.split(/[\\/]/).pop() ?? path,
					fit: 'cover',
					autoRotate: true,
					dither: true,
				}))
			return { project: { ...project, photos: [...project.photos, ...added] } }
		}),

	updatePhoto: (id, patch) =>
		set(({ project }) => ({
			project: { ...project, photos: patchById(project.photos, id, patch) },
		})),

	removePhoto: (id) =>
		set(({ project }) => ({
			project: { ...project, photos: project.photos.filter((item) => item.id !== id) },
		})),

	movePhoto: (id, direction) =>
		set(({ project }) => {
			const photos = [...project.photos]
			const index = photos.findIndex((photo) => photo.id === id)
			const target = index + direction
			if (index < 0 || target < 0 || target >= photos.length) return { project }
			;[photos[index], photos[target]] = [photos[target], photos[index]]
			return { project: { ...project, photos } }
		}),

	setPreviewIndex: (index) => set({ previewIndex: Math.max(0, index) }),
}))

function patchById<T extends { id: string }>(
	items: T[],
	id: string,
	patch: Partial<Omit<T, 'id'>>,
): T[] {
	return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

/**
 * Writes the project back to the app config directory shortly after it stops
 * changing, so closing the window never loses work.
 */
export function startAutosave(): () => void {
	let timer: ReturnType<typeof setTimeout> | undefined

	const unsubscribe = useStudio.subscribe((state, previous) => {
		if (!state.hydrated || state.project === previous.project) return
		clearTimeout(timer)
		timer = setTimeout(() => {
			saveStoredProject(serialiseProject(useStudio.getState().project)).catch((error) =>
				console.error('Could not save the project', error),
			)
		}, 600)
	})

	return () => {
		clearTimeout(timer)
		unsubscribe()
	}
}
