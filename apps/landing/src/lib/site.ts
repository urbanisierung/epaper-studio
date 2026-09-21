/** Everything about the project that more than one section needs to know. */
export const SITE = {
	name: 'E-Paper Studio',
	tagline: 'Your calendar and your photos, on a Waveshare PhotoPainter.',
	description:
		'A desktop app for the Waveshare PhotoPainter 7.3" e-paper display. Design a daily calendar with birthdays, holidays and a chore rota, convert photos, and write both straight to the SD card. No Node, no Python, no ImageMagick.',
	repo: 'https://github.com/urbanisierung/epaper-studio',
	releases: 'https://github.com/urbanisierung/epaper-studio/releases/latest',
	issues: 'https://github.com/urbanisierung/epaper-studio/issues',
	author: { name: 'u11g.com', url: 'https://u11g.com' },
	device: {
		name: 'Waveshare PhotoPainter 7.3"',
		url: 'https://www.waveshare.com/product/photopainter.htm',
	},
} as const
