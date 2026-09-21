import { Apple, Monitor, Terminal } from '@cascivo/icons'
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Flex,
	Grid,
	Heading,
	Text,
} from '@cascivo/react'
import type { ComponentType } from 'react'
import { SITE } from '../lib/site'

type Platform = {
	icon: ComponentType<{ size?: number; className?: string }>
	title: string
	body: string
}

const PLATFORMS: Platform[] = [
	{
		icon: Apple,
		title: 'macOS',
		body: 'One universal .dmg for both Apple Silicon and Intel Macs.',
	},
	{
		icon: Monitor,
		title: 'Windows',
		body: 'An .msi installer, or a standalone .exe, for x86_64.',
	},
	{
		icon: Terminal,
		title: 'Linux',
		body: 'An .AppImage, a .deb or an .rpm, for x86_64.',
	},
]

export function Download() {
	return (
		<section id="download" className="landing-width landing-section">
			<Flex direction="vertical" gap={6} align="center">
				<Flex direction="vertical" gap={2} align="center">
					<Heading level={2} size="xl">
						Download
					</Heading>
					<Text muted className="landing-lede" style={{ textAlign: 'center' }}>
						Every release is built on GitHub from the source in this repository.
					</Text>
				</Flex>
				<Grid cols={{ base: 1, md: 3 }} gap={4} style={{ inlineSize: '100%' }}>
					{PLATFORMS.map((platform) => (
						<Card key={platform.title} variant="outlined">
							<CardHeader>
								<platform.icon size={28} className="landing-icon" />
								<CardTitle>{platform.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<Text muted>{platform.body}</Text>
							</CardContent>
						</Card>
					))}
				</Grid>
				<Button asChild size="lg">
					<a href={SITE.releases}>Go to the latest release</a>
				</Button>
				<Text size="sm" muted className="landing-lede" style={{ textAlign: 'center' }}>
					The installers are not code-signed yet, so macOS and Windows warn the first time you open
					one. Building from source avoids the warning.
				</Text>
			</Flex>
		</section>
	)
}
