import { Card, CardContent, CardHeader, CardTitle, Flex, Grid, Heading, Text } from '@cascivo/react'

const STEPS = [
	{
		title: 'Set it up',
		body: 'Portrait or landscape, the first day, how many days to cover, and the language the pages are printed in.',
	},
	{
		title: 'Fill it in',
		body: 'Type in birthdays, holidays and chores, or import a file you already have. Add photos if you want them on the card too.',
	},
	{
		title: 'Generate',
		body: 'Plug in the SD card, choose it, and press once. The app writes pic/*.bmp and fileList.txt in the layout the display expects.',
	},
	{
		title: 'Put the card back',
		body: 'The app walks you through it, and can flash the firmware that decides how often the display turns the page — every 6, 12 or 24 hours.',
	},
]

export function HowItWorks() {
	return (
		<section id="how-it-works" className="landing-width landing-section">
			<Flex direction="vertical" gap={6}>
				<Flex direction="vertical" gap={2}>
					<Heading level={2} size="xl">
						How it works
					</Heading>
					<Text muted className="landing-lede">
						Four steps, and the fourth is only needed once.
					</Text>
				</Flex>
				<Grid cols={{ base: 1, md: 2 }} gap={4}>
					{STEPS.map((step, index) => (
						<Card key={step.title}>
							<CardHeader>
								<Text as="span" size="sm" weight="semibold" className="landing-step-number">
									{String(index + 1).padStart(2, '0')}
								</Text>
								<CardTitle>{step.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<Text muted>{step.body}</Text>
							</CardContent>
						</Card>
					))}
				</Grid>
			</Flex>
		</section>
	)
}
