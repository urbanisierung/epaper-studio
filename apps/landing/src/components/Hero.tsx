import { Badge, Button, Flex, Heading, Text } from '@cascivo/react'
import { SITE } from '../lib/site'

export function Hero() {
	return (
		<section className="landing-width landing-hero">
			<Flex direction="vertical" align="center" gap={5}>
				<Badge variant="outline">{SITE.device.name}</Badge>
				<Heading level={1} size="2xl">
					{SITE.name}
				</Heading>
				<Text size="lg" muted className="landing-lede">
					{SITE.tagline} Design a page for every day — birthdays, holidays, whose turn it is at the
					chores — convert your photos to the panel&rsquo;s seven colours, and write the whole card
					in one press.
				</Text>
				<Flex gap={3} justify="center" wrap>
					<Button asChild size="lg">
						<a href={SITE.releases}>Download for macOS, Windows or Linux</a>
					</Button>
					<Button asChild size="lg" variant="secondary">
						<a href={SITE.repo}>Read the source</a>
					</Button>
				</Flex>
				<Text size="sm" muted>
					Free and open source. Nothing to install alongside it — no Node, no Python, no
					ImageMagick.
				</Text>
			</Flex>
		</section>
	)
}
