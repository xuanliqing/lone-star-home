import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createPublicKey, createHash } from 'node:crypto';

const root = path.resolve(fileURLToPath(new URL('../build/chrome-extension/', import.meta.url)));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.chrome_url_overrides, { newtab: 'index.html' });
assert.equal(createPublicKey({ key: Buffer.from(manifest.key, 'base64'), type: 'spki', format: 'der' }).asymmetricKeyType, 'rsa');
assert.deepEqual(manifest.permissions ?? [], []);
assert.deepEqual(manifest.host_permissions, ['https://api.open-meteo.com/*', 'https://geocoding-api.open-meteo.com/*']);
assert.equal(manifest.content_scripts, undefined);
assert.equal(manifest.background, undefined);
assert.ok(manifest.content_security_policy.extension_pages.includes("script-src 'self';"));
assert.ok(!manifest.content_security_policy.extension_pages.includes('unsafe-eval'));

async function exists(relative, from = root) {
  const target = path.resolve(from, decodeURIComponent(relative.split(/[?#]/)[0]));
  assert.ok(target.startsWith(root + path.sep), `Resource escapes extension: ${relative}`);
  assert.ok((await stat(target)).isFile(), `Missing resource: ${relative}`);
}
async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) { await walk(file); continue; }
    if (!/\.(html|css|js)$/.test(file)) continue;
    const text = await readFile(file, 'utf8');
    if (file.endsWith('.html')) {
      assert.ok(!/<script\b(?![^>]*\bsrc=)[^>]*>\s*\S/i.test(text), `Inline script: ${file}`);
      assert.ok(!/\son[a-z]+\s*=/i.test(text), `Inline handler: ${file}`);
      for (const match of text.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
        if (/^(?:#|[a-z][a-z\d+.-]*:|\/\/)/i.test(match[1])) continue;
        await exists(match[1], directory);
      }
    }
    if (file.endsWith('.css')) {
      for (const match of text.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) {
        if (/^(?:#|data:)/.test(match[1])) continue;
        assert.ok(!/^https?:/.test(match[1]), `Remote CSS resource: ${match[1]}`);
        await exists(match[1], directory);
      }
    }
    if (file.endsWith('.js')) assert.ok(!/\beval\s*\(|\bnew\s+Function\s*\(/.test(text), `Dynamic code incompatible with MV3: ${file}`);
  }
}
await walk(root);
for (const [size, icon] of Object.entries(manifest.icons)) {
  const bytes = await readFile(path.join(root, icon));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16), Number(size));
  assert.equal(bytes.readUInt32BE(20), Number(size));
}
for (const resource of ['assets/amiya/amiya.skel', 'assets/amiya/amiya.atlas', 'assets/amiya/amiya.png', 'assets/amiya/portrait.png', 'vendor/SPINE-LICENSE.txt', 'assets/SOURCES.md']) await exists(resource);
const atlas = await readFile(path.join(root, 'assets/amiya/amiya.atlas'), 'utf8');
const scene = JSON.parse(await readFile(path.join(root, 'assets/amiya/scene/scene.json'), 'utf8'));
for (const material of Object.values(scene.materials)) for (const texture of Object.values(material.textures)) await exists('assets/amiya/scene/' + encodeURIComponent(texture.file));
assert.equal(atlas.trim().split(/\r?\n/)[0], 'amiya.png');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
assert.ok(html.includes(manifest.content_security_policy.extension_pages));
const digest = createHash('sha256').update(Buffer.from(manifest.key, 'base64')).digest('hex').slice(0, 32);
const id = digest.replace(/[0-9a-f]/g, c => String.fromCharCode(97 + parseInt(c, 16)));
console.log(`PASS: Manifest V3, fixed identity ${id}, resource links, icons, CSP compatibility and local animation assets.`);
