import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../dist/assistant.js', import.meta.url), 'utf8');
const interval = source.match(/const frameInterval=[^;]+;/)?.[0];
const tick = source.slice(source.indexOf(' function tick(time)'), source.indexOf(' function sync()'));
assert.ok(interval && tick.includes('requestAnimationFrame(tick)'));
function setup() {
  const deltas = [];
  const context = {
    frame: 0, lastTime: null, nextPaint: null, sceneTime: 0, paused: false, draws: 0,
    isPaused: () => context.paused,
    animation: { update: delta => deltas.push(delta), apply() {}, getCurrent: () => ({ animation: { name: 'Idle' } }) },
    skeleton: { updateWorldTransform() {} }, suppressScenery() {},
    draw: () => context.draws++, canvas: { dataset: {} }, requestAnimationFrame: () => 1,
  };
  vm.createContext(context);
  vm.runInContext(`${interval}\n${tick}\nthis.step=tick;`, context);
  return { context, deltas };
}
for (const hz of [30, 59.94, 60, 90, 120, 144, 165, 240]) {
  const { context, deltas } = setup();
  for (let i = 0; i / hz < 10; i++) context.step(Math.round(i * 1000 / hz * 1000) / 1000);
  const expected = Math.min(hz, 60) * 10;
  assert.ok(Math.abs(context.draws - expected) <= 1, `${hz} Hz: unexpected ${context.draws} draws`);
  assert.ok(Math.abs(deltas.reduce((sum, delta) => sum + delta, 0) - 10) < .05, `${hz} Hz: animation speed changed`);
  console.log(`${hz} Hz display: ${context.draws} rendered frames / 10 seconds`);
}
{
  const { context, deltas } = setup();
  context.step(0); context.step(16.667);
  context.paused = true; context.step(33.333);
  assert.equal(context.draws, 2);
  context.paused = false; context.step(60000);
  assert.equal(deltas.at(-1), 0, 'Resuming must not jump ahead');
  context.step(61000);
  assert.equal(deltas.at(-1), .1, 'A stalled frame must keep the existing delta limit');
}
console.log('PASS: cadence, animation speed, pause/resume and stalled frames.');
