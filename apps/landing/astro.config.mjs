import react from '@astrojs/react'
import { defineConfig } from 'astro/config'

// `site` is what canonical and Open Graph URLs are built from, so it is the
// custom domain rather than the project's `*.pages.dev` address.
export default defineConfig({
	site: 'https://epaper-studio.u11g.com',
	integrations: [react()],
	vite: {
		resolve: {
			// Vite externalises node_modules in its server build, and Astro collects a
			// page's CSS by walking the module graph — so an externalised cascivo
			// renders with the right class names and no rules anywhere. This puts it
			// back in the graph. It has to be `resolve.noExternal`, not
			// `ssr.noExternal`: static routes are prerendered in their own Vite
			// environment, which `ssr.*` never reaches.
			noExternal: [/^@cascivo\//],
		},
	},
})
