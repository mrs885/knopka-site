// Mechanical derivation: keep text/layout in sync, replace image slots only.
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('./', import.meta.url);
const source = readFileSync(new URL('source/index.html', root), 'utf8');
const html = source.replace(/<img\b([^>]+)>/g, (_, attrs) => {
  const name = attrs.match(/src="[^\"]*\/([^/\"]+)\.png"/)[1];
  const cls = attrs.match(/class="([^\"]+)"/)?.[1] || '';
  const width = attrs.match(/width="(\d+)"/)[1];
  const height = attrs.match(/height="(\d+)"/)[1];
  return `<span class="media-slot ${cls}" role="img" aria-label="Место для изображения ${name}" style="--slot-ratio:${width}/${height}">${name}</span>`;
});
writeFileSync(new URL('template/index.html', root), html);
