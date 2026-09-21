// Generates the app icons Tauri bundles, so they can be rebuilt without any
// image tooling installed. Run with: node scripts/generate-icons.mjs

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src-tauri', 'icons')

const INK = [26, 26, 26]
const PAPER = [250, 250, 248]
const ACCENT = [214, 40, 40]

/** Draws the icon at an arbitrary size: a page with a red "today" tile. */
function drawIcon(size) {
	const pixels = new Uint8Array(size * size * 4)
	const u = size / 32 // design grid unit

	const put = (x, y, [r, g, b], a = 255) => {
		if (x < 0 || y < 0 || x >= size || y >= size) return
		const i = (y * size + x) * 4
		const alpha = a / 255
		pixels[i] = Math.round(pixels[i] * (1 - alpha) + r * alpha)
		pixels[i + 1] = Math.round(pixels[i + 1] * (1 - alpha) + g * alpha)
		pixels[i + 2] = Math.round(pixels[i + 2] * (1 - alpha) + b * alpha)
		pixels[i + 3] = Math.max(pixels[i + 3], a)
	}

	// Rounded rectangle with a 1px-ish analytic antialias on the corners.
	const roundedRect = (x0, y0, w, h, radius, color) => {
		for (let y = Math.floor(y0); y < Math.ceil(y0 + h); y++) {
			for (let x = Math.floor(x0); x < Math.ceil(x0 + w); x++) {
				const cx = Math.min(Math.max(x + 0.5, x0 + radius), x0 + w - radius)
				const cy = Math.min(Math.max(y + 0.5, y0 + radius), y0 + h - radius)
				const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
				const coverage = Math.min(Math.max(radius - distance + 0.5, 0), 1)
				if (coverage > 0) put(x, y, color, Math.round(coverage * 255))
			}
		}
	}

	// The page.
	roundedRect(3 * u, 2 * u, 26 * u, 28 * u, 3 * u, PAPER)
	// Its border.
	for (const inset of [0, 0.5]) {
		roundedRect(3 * u + inset, 2 * u + inset, 26 * u - 2 * inset, 28 * u - 2 * inset, 3 * u, INK)
	}
	roundedRect(3 * u + 1.2 * u, 2 * u + 1.2 * u, 26 * u - 2.4 * u, 28 * u - 2.4 * u, 2.2 * u, PAPER)
	// The "today" tile.
	roundedRect(15 * u, 5 * u, 11 * u, 11 * u, 1.6 * u, ACCENT)
	// Event lines on the left.
	for (let line = 0; line < 3; line++) {
		roundedRect(6 * u, (6 + line * 3.2) * u, 7 * u, 1.4 * u, 0.7 * u, INK)
	}
	// Month grid at the bottom.
	for (let row = 0; row < 3; row++) {
		for (let column = 0; column < 5; column++) {
			const color = row === 1 && column === 2 ? ACCENT : INK
			roundedRect((6 + column * 4) * u, (19 + row * 3.4) * u, 2.2 * u, 2.2 * u, 1.1 * u, color)
		}
	}

	return pixels
}

function crc32(buffer) {
	let crc = ~0
	for (const byte of buffer) {
		crc ^= byte
		for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
	}
	return ~crc >>> 0
}

function chunk(type, data) {
	const length = Buffer.alloc(4)
	length.writeUInt32BE(data.length)
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
	const checksum = Buffer.alloc(4)
	checksum.writeUInt32BE(crc32(body))
	return Buffer.concat([length, body, checksum])
}

function encodePng(size, pixels) {
	const header = Buffer.alloc(13)
	header.writeUInt32BE(size, 0)
	header.writeUInt32BE(size, 4)
	header[8] = 8 // bit depth
	header[9] = 6 // RGBA
	// Each scanline is prefixed with filter type 0 (none).
	const raw = Buffer.alloc(size * (size * 4 + 1))
	for (let y = 0; y < size; y++) {
		raw[y * (size * 4 + 1)] = 0
		Buffer.from(pixels.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1)
	}
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0)),
	])
}

/** Windows .ico, carrying PNG payloads (supported since Windows Vista). */
function encodeIco(entries) {
	const header = Buffer.alloc(6)
	header.writeUInt16LE(0, 0)
	header.writeUInt16LE(1, 2) // type: icon
	header.writeUInt16LE(entries.length, 4)
	const directory = Buffer.alloc(16 * entries.length)
	let offset = header.length + directory.length
	entries.forEach(({ size, png }, index) => {
		const at = index * 16
		directory[at] = size >= 256 ? 0 : size
		directory[at + 1] = size >= 256 ? 0 : size
		directory[at + 4] = 1 // colour planes
		directory.writeUInt16LE(32, at + 6) // bits per pixel
		directory.writeUInt32LE(png.length, at + 8)
		directory.writeUInt32LE(offset, at + 12)
		offset += png.length
	})
	return Buffer.concat([header, directory, ...entries.map((entry) => entry.png)])
}

/** macOS .icns, carrying PNG payloads. */
function encodeIcns(entries) {
	const blocks = entries.map(({ type, png }) => {
		const head = Buffer.alloc(8)
		head.write(type, 0, 'ascii')
		head.writeUInt32BE(png.length + 8, 4)
		return Buffer.concat([head, png])
	})
	const body = Buffer.concat(blocks)
	const head = Buffer.alloc(8)
	head.write('icns', 0, 'ascii')
	head.writeUInt32BE(body.length + 8, 4)
	return Buffer.concat([head, body])
}

const png = (size) => encodePng(size, drawIcon(size))

mkdirSync(OUT_DIR, { recursive: true })

const files = {
	'32x32.png': png(32),
	'128x128.png': png(128),
	'128x128@2x.png': png(256),
	'icon.png': png(512),
	'icon.ico': encodeIco([16, 32, 48, 64, 128, 256].map((size) => ({ size, png: png(size) }))),
	'icon.icns': encodeIcns([
		{ type: 'ic07', png: png(128) },
		{ type: 'ic08', png: png(256) },
		{ type: 'ic09', png: png(512) },
	]),
}

for (const [name, data] of Object.entries(files)) {
	writeFileSync(join(OUT_DIR, name), data)
	console.log(`${name} (${data.length} bytes)`)
}
