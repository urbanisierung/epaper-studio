import { Flex, Heading, Text } from '@cascivo/react'

type Shot = {
	src: string
	alt: string
	caption: string
}

// Captured at 1320x880 — the app's own default window size — then halved.
const WIDTH = 1760
const HEIGHT = 1173

const SHOTS: Shot[] = [
	{
		src: '/screenshots/setup.png',
		alt: 'The Setup tab: panel size, date range and calendar language on the left, with a live preview of the page on the right.',
		caption:
			'Every setting redraws the page beside it, at the panel’s real resolution. What you see is what lands on the card.',
	},
	{
		src: '/screenshots/birthdays.png',
		alt: 'The Birthdays tab: a name and date field above a list of birthdays, each showing how many days away it is.',
		caption:
			'Birthdays, holidays and chores are typed in or imported — sorted by whichever is coming up next.',
	},
	{
		src: '/screenshots/export.png',
		alt: 'The Export tab: choose the SD card folder, choose what to write, then one Generate button.',
		caption:
			'Point it at the SD card, press once. The pictures and fileList.txt are written for you.',
	},
]

export function Screenshots() {
	return (
		<section id="screenshots" className="landing-width landing-section">
			<Flex direction="vertical" gap={6}>
				<Flex direction="vertical" gap={2}>
					<Heading level={2} size="xl">
						A look at it
					</Heading>
					<Text muted className="landing-lede">
						One window, six tabs, and the page you are about to print always in view.
					</Text>
				</Flex>
				<Flex direction="vertical" gap={8}>
					{SHOTS.map((shot) => (
						<figure key={shot.src} className="landing-shot">
							<img
								src={shot.src}
								alt={shot.alt}
								width={WIDTH}
								height={HEIGHT}
								loading="lazy"
								decoding="async"
							/>
							<Text as="div" size="sm" muted>
								{shot.caption}
							</Text>
						</figure>
					))}
				</Flex>
			</Flex>
		</section>
	)
}
