import { Button, Flex, Link, Text } from '@cascivo/react'
import { SITE } from '../lib/site'

export function SiteHeader() {
	return (
		<header className="landing-header">
			<nav className="landing-width landing-nav" aria-label="Main">
				<Link href="/" variant="standalone" size="lg">
					<Text as="span" weight="semibold">
						{SITE.name}
					</Text>
				</Link>
				<Flex direction="horizontal" align="center" gap={5} className="landing-nav-links">
					<Link href="#features" size="sm" data-nav-optional>
						Features
					</Link>
					<Link href="#how-it-works" size="sm" data-nav-optional>
						How it works
					</Link>
					<Link href="#faq" size="sm" data-nav-optional>
						FAQ
					</Link>
					<Button asChild size="sm">
						<a href={SITE.releases}>Download</a>
					</Button>
				</Flex>
			</nav>
		</header>
	)
}
