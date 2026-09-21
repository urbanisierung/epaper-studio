import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Tauri serves the UI from a fixed port in development and from `dist` in a
// packaged build.
export default defineConfig({
	plugins: [react()],
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		watch: { ignored: ['**/src-tauri/**'] },
	},
	build: {
		target: 'es2021',
		sourcemap: false,
	},
})
