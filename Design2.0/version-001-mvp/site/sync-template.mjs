// Mechanical derivation: keep text/layout in sync, replace image slots only.
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('./', import.meta.url);
const source = readFileSync(new URL('source/index.html', root), 'utf8');
const currentTemplate = readFileSync(new URL('template/index.html', root), 'utf8');
const startSectionPattern = /<section class="section shell" id="start"[\s\S]*?<\/section>/;
const tariffSectionPattern = /<section class="tariff" id="tariff"[\s\S]*?<\/section>/;
const customStartSection = currentTemplate.match(startSectionPattern)?.[0];
const customTariffSection = currentTemplate.match(tariffSectionPattern)?.[0];
if (!customStartSection) throw new Error('Template #start section not found');
if (!customTariffSection) throw new Error('Template #tariff section not found');
const html = source.replace(/<img\b([^>]+)>/g, (_, attrs) => {
  const name = attrs.match(/src="[^\"]*\/([^/\"]+)\.png"/)[1];
  const cls = attrs.match(/class="([^\"]+)"/)?.[1] || '';
  const width = attrs.match(/width="(\d+)"/)[1];
  const height = attrs.match(/height="(\d+)"/)[1];
  return `<span class="media-slot ${cls}" role="img" aria-label="Место для изображения ${name}" style="--slot-ratio:${width}/${height}">${name}</span>`;
})
  .replace(startSectionPattern, customStartSection)
  .replace(tariffSectionPattern, customTariffSection)
  .replaceAll('href="#tariff">Попробовать бесплатно', 'href="#start">Попробовать бесплатно');
writeFileSync(new URL('template/index.html', root), html);
