import { Calendar, ChevronLeft, ChevronRight } from '@cascivo/icons'
import {
	Card,
	CardContent,
	CardHeader,
	EmptyState,
	Flex,
	IconButton,
	Slider,
	Text,
} from '@cascivo/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '../lib/i18n/useT'
import { drawPage } from '../lib/render/calendar'
import { ensureFont } from '../lib/render/fonts'
import { formatFullDate } from '../lib/render/locale'
import { buildSchedule } from '../lib/render/schedule'
import { useStudio } from '../lib/state/store'
import { Eyebrow } from './ui/controls'

/** Exactly what the panel will show, at panel resolution, scaled to fit. */
export function PreviewPane() {
	const t = useT()
	const project = useStudio((state) => state.project)
	const previewIndex = useStudio((state) => state.previewIndex)
	const setPreviewIndex = useStudio((state) => state.setPreviewIndex)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [fontsReady, setFontsReady] = useState(false)

	const pages = useMemo(() => buildSchedule(project), [project])
	const index = Math.min(previewIndex, Math.max(0, pages.length - 1))
	const page = pages[index]

	// The layout measures text, so nothing may be drawn before the face is in.
	const fontFamily = project.settings.fontFamily
	useEffect(() => {
		let cancelled = false
		setFontsReady(false)
		ensureFont(fontFamily).then(() => !cancelled && setFontsReady(true))
		return () => {
			cancelled = true
		}
	}, [fontFamily])

	useEffect(() => {
		if (!canvasRef.current || !page || !fontsReady) return
		drawPage(canvasRef.current, project, page.date)
	}, [project, page, fontsReady])

	const { width, height } = project.settings
	// Keep the preview inside a sensible box whichever way round the panel is.
	const scale = Math.min(320 / width, 520 / height)

	return (
		<Card variant="outlined" className="epaper-preview">
			<CardHeader>
				<Eyebrow>{t('preview.title')}</Eyebrow>
				<p className="epaper-mono">{t('preview.pixels', { width, height })}</p>
			</CardHeader>
			<CardContent>
				{page ? (
					<Flex gap={3} align="center">
						<canvas
							ref={canvasRef}
							className="epaper-canvas"
							style={{ width: width * scale, height: height * scale }}
						/>

						<Flex
							direction="horizontal"
							align="center"
							justify="between"
							gap={2}
							style={{ inlineSize: '100%' }}
						>
							<IconButton
								label={t('preview.previous')}
								variant="ghost"
								size="sm"
								icon={<ChevronLeft size={16} />}
								disabled={index === 0}
								onClick={() => setPreviewIndex(index - 1)}
							/>
							<div style={{ textAlign: 'center' }}>
								<Text as="span" size="sm" weight="semibold">
									{formatFullDate(project.settings.locale, page.date)}
								</Text>
								<p className="epaper-eyebrow">
									{t('preview.page', { index: index + 1, total: pages.length })}
								</p>
							</div>
							<IconButton
								label={t('preview.next')}
								variant="ghost"
								size="sm"
								icon={<ChevronRight size={16} />}
								disabled={index >= pages.length - 1}
								onClick={() => setPreviewIndex(index + 1)}
							/>
						</Flex>

						<Slider
							min={0}
							max={Math.max(0, pages.length - 1)}
							value={index}
							aria-label={t('preview.title')}
							onChange={(event) => setPreviewIndex(Number(event.target.value))}
							style={{ inlineSize: '100%' }}
						/>
					</Flex>
				) : (
					<EmptyState
						icon={<Calendar size={24} />}
						title={t('preview.title')}
						description={t('preview.empty')}
					/>
				)}
			</CardContent>
		</Card>
	)
}
