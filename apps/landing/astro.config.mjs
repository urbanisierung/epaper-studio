import react from '@astrojs/react'
import { defineConfig } from 'astro/config'

// Update `site` if the page moves to a custom domain — it is what the sitemap
// and canonical URLs are built from.
export default defineConfig({
	site: 'https://u11g-epaper-studio.pages.dev',
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
