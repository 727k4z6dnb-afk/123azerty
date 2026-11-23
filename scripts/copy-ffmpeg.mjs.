import { copyFileSync, mkdirSync } from 'node:fs';
const source = 'node_modules/@ffmpeg/core/dist/umd';
const destination = 'public/ffmpeg-core';
mkdirSync(destination, { recursive: true });
for (const name of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  copyFileSync(`${source}/${name}`, `${destination}/${name}`);
}
