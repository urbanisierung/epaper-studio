import { Calendar, Gift, Globe, Image, PaintCan, Users } from '@cascivo/icons'
import {
	AutoGrid,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Flex,
	Heading,
	Text,
} from '@cascivo/react'
import type { ComponentType } from 'react'

type Feature = {
	icon: ComponentType<{ size?: number; className?: string }>
	title: string
	body: string
}

const FEATURES: Feature[] = [
	{
		icon: Calendar,
		title: 'A page for every day',
		body: "Today's date on a tile, what is coming up, and the current month with today circled. A trip that runs nine days takes one page, not nine.",
	},
	{
		icon: Gift,
		title: 'Birthdays and holidays',
		body: 'Typed into the app, not into source code. One JSON or CSV file holds every list, so a backup or a hand-over is a single file. CSV and .ics import and export too.',
	},
	{
		icon: Users,
		title: 'A chore rota',
		body: 'Recurring jobs with a rotation — bins out every other Tuesday, one name after another. One anchor date sets both the rhythm and whose turn it is.',
	},
	{
		icon: Image,
		title: 'Photos, dithered properly',
		body: 'Pictures are resized to the panel and dithered to its seven colours, with a preview of the result before anything is written to the card.',
	},
	{
		icon: PaintCan,
		title: 'Twelve looks',
		body: 'The interface is built from the cascivo design system, so every first-party theme is one menu away, light or dark, following the OS if you ask it to.',
	},
	{
		icon: Globe,
		title: 'English or German',
		body: 'The app and the printed pages are translated separately, so the pages can be German while the app is read in English — or the other way round.',
	},
]

export function Features() {
	return (
		<section id="features" className="landing-width landing-section">
			<Flex direction="vertical" gap={6}>
				<Flex direction="vertical" gap={2}>
					<Heading level={2} size="xl">
						What it does
					</Heading>
					<Text muted className="landing-lede">
						Everything the display needs, from one window.
					</Text>
				</Flex>
				<AutoGrid min="17rem" gap={4}>
					{FEATURES.map((feature) => (
						<Card key={feature.title} variant="outlined">
							<CardHeader>
								<feature.icon size={28} className="landing-icon" />
								<CardTitle>{feature.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<Text muted>{feature.body}</Text>
							</CardContent>
						</Card>
					))}
				</AutoGrid>
			</Flex>
		</section>
	)
}
