import { Flex, Link, Text } from '@cascivo/react'
import { SITE } from '../lib/site'

export function SiteFooter() {
	return (
		<footer className="landing-footer">
			<Flex
				direction="horizontal"
				className="landing-width"
				justify="between"
				align="center"
				gap={4}
				wrap
			>
				<Text size="sm" muted>
					Built by{' '}
					<Link href={SITE.author.url} size="sm" external>
						{SITE.author.name}
					</Link>
				</Text>
				<Flex direction="horizontal" gap={5} align="center" wrap>
					<Link href={SITE.repo} size="sm" external>
						Source
					</Link>
					<Link href={SITE.releases} size="sm" external>
						Releases
					</Link>
					<Link href={SITE.issues} size="sm" external>
						Issues
					</Link>
					<Link href={SITE.device.url} size="sm" external>
						The display
					</Link>
				</Flex>
			</Flex>
		</footer>
	)
}
