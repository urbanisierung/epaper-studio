// Writes a version into the desktop app's Tauri manifest.
//
// The release tag is the source of truth for the app version, so CI runs this
// twice on a tag: once so the installers are built at the tagged version, and
// once on the default branch to commit the manifest back in step.
//
// It rewrites the one line rather than round-tripping the JSON, so the rest of
// the file keeps the formatting Biome gave it.

import { readFileSync, writeFileSync } from 'node:fs'

const [version, file] = process.argv.slice(2)

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version ?? '')) {
	console.error(`Not a version: ${version}`)
	process.exit(1)
}

if (!file) {
	console.error('Usage: set-app-version.mjs <version> <tauri.conf.json>')
	process.exit(1)
}

const source = readFileSync(file, 'utf8')
// The top-level key, at one tab of indentation — not a nested `version`.
const line = /^\t"version": "[^"]*",$/m

if (!line.test(source)) {
	console.error(`No top-level "version" in ${file}`)
	process.exit(1)
}

writeFileSync(file, source.replace(line, `\t"version": "${version}",`))

console.log(`${file}: version ${version}`)
