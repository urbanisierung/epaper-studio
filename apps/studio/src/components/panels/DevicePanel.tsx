import { Cpu, HardDrive } from '@cascivo/icons'
import { Alert, Button, EmptyState, Flex, Steps } from '@cascivo/react'
import { open } from '@tauri-apps/plugin-dialog'
import { useEffect, useState } from 'react'
import { useT } from '../../lib/i18n/useT'
import { copyFirmware, type FirmwareImage, listFirmware } from '../../lib/io/tauri'
import { Section } from '../ui/controls'

/**
 * The parts of the workflow that used to live in a README nobody else had
 * read: how to get a card back onto the display, and how to change how often
 * it turns the page.
 */
export function DevicePanel({ onError }: { onError: (message: string) => void }) {
	const t = useT()
	const [firmware, setFirmware] = useState<FirmwareImage[]>([])
	const [copied, setCopied] = useState<string | null>(null)

	useEffect(() => {
		listFirmware()
			.then(setFirmware)
			.catch(() => setFirmware([]))
	}, [])

	const flash = async (image: FirmwareImage) => {
		try {
			const picked = await open({
				directory: true,
				multiple: false,
				title: t('device.firmware.dialog'),
			})
			if (typeof picked !== 'string') return
			setCopied(await copyFirmware(image.fileName, picked))
		} catch (error) {
			onError(String(error))
		}
	}

	return (
		<Flex gap={4}>
			<Section
				index={1}
				eyebrow={t('device.eyebrow')}
				title={t('device.card.title')}
				description={t('device.card.description')}
			>
				<Steps
					orientation="vertical"
					ariaLabel={t('device.card.title')}
					steps={[
						{ label: t('device.card.step1') },
						{ label: t('device.card.step2') },
						{ label: t('device.card.step3') },
						{ label: t('device.card.step4') },
						{ label: t('device.card.step5') },
					]}
				/>
				<div style={{ marginBlockStart: 'var(--cascivo-space-4)' }}>
					<Alert variant="info">{t('device.card.note')}</Alert>
				</div>
			</Section>

			<Section
				index={2}
				eyebrow={t('device.eyebrow')}
				title={t('device.firmware.title')}
				description={t('device.firmware.description')}
			>
				{firmware.length === 0 ? (
					<EmptyState
						icon={<Cpu size={24} />}
						title={t('device.firmware.title')}
						description={t('device.firmware.none')}
					/>
				) : (
					<>
						<Steps
							orientation="vertical"
							ariaLabel={t('device.firmware.title')}
							steps={[
								{ label: t('device.firmware.step1') },
								{ label: t('device.firmware.step2') },
								{ label: t('device.firmware.step3') },
							]}
						/>
						<Flex
							direction="horizontal"
							gap={2}
							wrap
							style={{ marginBlockStart: 'var(--cascivo-space-4)' }}
						>
							{firmware.map((image) => (
								<Button key={image.fileName} variant="secondary" onClick={() => flash(image)}>
									<HardDrive size={16} />
									{t('device.firmware.every', { count: image.intervalHours })}
								</Button>
							))}
						</Flex>
						{copied && (
							<p className="epaper-mono" style={{ marginBlockStart: 'var(--cascivo-space-3)' }}>
								{t('device.firmware.copied', { path: copied })}
							</p>
						)}
						<div style={{ marginBlockStart: 'var(--cascivo-space-4)' }}>
							<Alert variant="info">{t('device.firmware.note')}</Alert>
						</div>
					</>
				)}
			</Section>
		</Flex>
	)
}
