import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Flex,
	Heading,
	Text,
} from '@cascivo/react'
import { SITE } from '../lib/site'

const QUESTIONS = [
	{
		question: 'Which display does it support?',
		answer: `The ${SITE.device.name}, in portrait (480x800) or landscape (800x480). Other panels are not supported today — the page layout and the seven-colour palette are that display's.`,
	},
	{
		question: 'Do I need to install anything else?',
		answer:
			'No. The image pipeline — the BMP writer, the dithering, the photo fitting — is built into the app, so there is no Node, no Python and no ImageMagick to install alongside it.',
	},
	{
		question: 'Where does my data go?',
		answer:
			'Nowhere. The project file lives on your machine, the app does not talk to a server, and the only thing that ever leaves it is what you write to the SD card yourself.',
	},
	{
		question: 'Can I share a list with someone else?',
		answer:
			'Yes. Birthdays, holidays and chores export together as one JSON or CSV file, and any one list can be exported on its own for a spreadsheet. The .ics export carries the dates only.',
	},
	{
		question: 'How often does the display turn the page?',
		answer:
			'That is the display’s own firmware, not the card. The app ships the 6-, 12- and 24-hour builds and copies the one you pick onto the device.',
	},
	{
		question: 'Something is wrong, or missing.',
		answer: `Open an issue at ${SITE.issues} — it is the same place the code is.`,
	},
]

/**
 * Hydrated: the accordion is the one interactive thing on the page. Every
 * answer is still in the server-rendered HTML, so it is indexed and readable
 * before the JavaScript arrives.
 */
export function Faq() {
	return (
		<section id="faq" className="landing-width landing-section">
			<Flex direction="vertical" gap={6}>
				<Heading level={2} size="xl">
					Questions
				</Heading>
				<Accordion type="single">
					{QUESTIONS.map((entry) => (
						<AccordionItem key={entry.question} value={entry.question}>
							<AccordionTrigger>{entry.question}</AccordionTrigger>
							<AccordionContent>
								<Text muted>{entry.answer}</Text>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</Flex>
		</section>
	)
}
