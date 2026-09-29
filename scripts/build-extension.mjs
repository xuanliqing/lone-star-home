import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generateKeyPairSync } from 'node:crypto';

const project = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(project, 'extension');
const destination = path.resolve(project, 'build/chrome-extension');
const manifestPath = path.join(source, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
// Keep the public identity stable when the unpacked directory is moved or updated.
// The private key is not retained; this is a local unpacked extension package.
if (!manifest.key) {
  manifest.key = generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey
    .export({ type: 'spki', format: 'der' }).toString('base64');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
await mkdir(destination, { recursive: true });
await cp(path.join(project, 'dist'), destination, { recursive: true });
await cp(source, destination, { recursive: true });
await cp(path.join(project, 'EXTENSION.md'), path.join(destination, '安装说明.md'));

// Applying the same policy in HTML also allows ordinary browser previews to
// exercise the extension's CSP without relaxing the installed extension policy.
const entry = path.join(destination, manifest.chrome_url_overrides.newtab);
const html = await readFile(entry, 'utf8');
const csp = manifest.content_security_policy.extension_pages.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
await writeFile(entry, html.replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`));
console.log(`Extension directory: ${destination}`);
