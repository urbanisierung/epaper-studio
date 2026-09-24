import { ChevronDown, ChevronUp, Image as ImageIcon, Plus, Trash } from '@cascivo/icons'
import {
	Button,
	EmptyState,
	Field,
	Flex,
	IconButton,
	NativeSelect,
	Text,
	Toggle,
} from '@cascivo/react'
import { useEffect, useState } from 'react'
import { useT } from '../../lib/i18n/useT'
import { open } from '../../lib/io/host'
import { previewPhoto } from '../../lib/io/tauri'
import { useStudio } from '../../lib/state/store'
import type { Photo } from '../../lib/types'
import { Section } from '../ui/controls'

/**
 * Photos go through the same pipeline the old shell script and `convert.py`
 * did — fit to the panel, then reduce to its seven colours — except it happens
 * inside the app, and you can see the result before writing anything.
 */
export function PhotosPanel({ onError }: { onError: (message: string) => void }) {
	const t = useT()
	const project = useStudio((state) => state.project)
	const addPhotos = useStudio((state) => state.addPhotos)
	const updatePhoto = useStudio((state) => state.updatePhoto)
	const removePhoto = useStudio((state) => state.removePhoto)
	const movePhoto = useStudio((state) => state.movePhoto)
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const selected = project.photos.find((photo) => photo.id === selectedId) ?? project.photos[0]

	const pick = async () => {
		try {
			const picked = await open({
				multiple: true,
				directory: false,
				title: t('photos.addDialog'),
				filters: [
					{
						name: t('photos.imageFilter'),
						extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'],
					},
				],
			})
			if (Array.isArray(picked) && picked.length > 0) addPhotos(picked)
		} catch (error) {
			onError(String(error))
		}
	}

	return (
		<Flex gap={4}>
			<Section
				index={1}
				eyebrow={t('photos.eyebrow')}
				title={t('photos.list.title', { count: project.photos.length })}
				description={t('photos.list.description')}
				action={
					<Button size="sm" onClick={pick}>
						<Plus size={16} />
						{t('photos.add')}
					</Button>
				}
			>
				{project.photos.length === 0 ? (
					<EmptyState
						icon={<ImageIcon size={24} />}
						title={t('photos.list.title', { count: 0 })}
						description={t('photos.empty')}
						action={
							<Button size="sm" onClick={pick}>
								{t('photos.add')}
							</Button>
						}
					/>
				) : (
					<div className="epaper-list">
						{project.photos.map((photo, index) => (
							<div
								key={photo.id}
								className="epaper-row epaper-row--photo"
								data-selected={selected?.id === photo.id}
							>
								<button
									type="button"
									className="epaper-row-select"
									title={photo.path}
									onClick={() => setSelectedId(photo.id)}
								>
									<span className="epaper-mono">{String(index + 1).padStart(2, '0')}</span>
									<span className="epaper-truncate">{photo.name}</span>
								</button>
								<Flex direction="horizontal" gap={1}>
									<IconButton
										label={t('action.moveUp')}
										variant="ghost"
										size="sm"
										icon={<ChevronUp size={16} />}
										disabled={index === 0}
										onClick={() => movePhoto(photo.id, -1)}
									/>
									<IconButton
										label={t('action.moveDown')}
										variant="ghost"
										size="sm"
										icon={<ChevronDown size={16} />}
										disabled={index === project.photos.length - 1}
										onClick={() => movePhoto(photo.id, 1)}
									/>
								</Flex>
								<IconButton
									label={t('action.remove')}
									variant="ghost"
									size="sm"
									icon={<Trash size={16} />}
									onClick={() => removePhoto(photo.id)}
								/>
							</div>
						))}
					</div>
				)}
			</Section>

			{selected && (
				<Section
					index={2}
					eyebrow={t('photos.eyebrow')}
					title={selected.name}
					description={t('photos.settings.description')}
				>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'minmax(0, 1fr) auto',
							gap: 'var(--cascivo-space-5)',
						}}
					>
						<Flex gap={4}>
							<Field label={t('photos.fit')}>
								<NativeSelect
									value={selected.fit}
									onChange={(event) =>
										updatePhoto(selected.id, {
											fit: event.target.value === 'contain' ? 'contain' : 'cover',
										})
									}
									options={[
										{ value: 'cover', label: t('photos.fit.cover') },
										{ value: 'contain', label: t('photos.fit.contain') },
									]}
								/>
							</Field>
							<Toggle
								label={t('photos.autoRotate')}
								checked={selected.autoRotate}
								onValueChange={(checked) => updatePhoto(selected.id, { autoRotate: checked })}
							/>
							<div>
								<Toggle
									label={t('photos.dither')}
									checked={selected.dither}
									onValueChange={(checked) => updatePhoto(selected.id, { dither: checked })}
								/>
								<Text size="sm" muted>
									{t('photos.dither.hint')}
								</Text>
							</div>
						</Flex>
						<PhotoPreview
							photo={selected}
							width={project.settings.width}
							height={project.settings.height}
						/>
					</div>
				</Section>
			)}
		</Flex>
	)
}

function PhotoPreview({ photo, width, height }: { photo: Photo; width: number; height: number }) {
	const t = useT()
	const [dataUrl, setDataUrl] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		setDataUrl(null)
		setError(null)
		previewPhoto(photo.path, {
			width,
			height,
			fit: photo.fit,
			autoRotate: photo.autoRotate,
			dither: photo.dither,
		})
			.then((url) => !cancelled && setDataUrl(url))
			.catch((cause) => !cancelled && setError(String(cause)))
		return () => {
			cancelled = true
		}
	}, [photo.path, photo.fit, photo.autoRotate, photo.dither, width, height])

	const scale = 200 / Math.max(width, height)

	return (
		<div className="epaper-photo-frame" style={{ width: width * scale, height: height * scale }}>
			{error ? (
				<span className="epaper-mono" style={{ padding: '0 0.5rem', textAlign: 'center' }}>
					{t('photos.unreadable')}
				</span>
			) : dataUrl ? (
				<img src={dataUrl} alt="" />
			) : (
				<span className="epaper-eyebrow">{t('photos.converting')}</span>
			)}
		</div>
	)
}
