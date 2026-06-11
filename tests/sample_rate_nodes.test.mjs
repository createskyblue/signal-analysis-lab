import assert from 'node:assert/strict';
import { def as lowpassDef, process as lowpassProcess } from '../src/nodes/lowpass.js';
import { def as highpassDef, process as highpassProcess } from '../src/nodes/highpass.js';
import { def as firDef, process as firProcess } from '../src/nodes/firlinear.js';
import { def as fftDef, process as fftProcess } from '../src/nodes/fft.js';
import { def as bpmDef, process as bpmProcess } from '../src/nodes/interval2bpm.js';

const sampleRateNodes = [
  ['lowpass', lowpassDef],
  ['highpass', highpassDef],
  ['firlinear', firDef],
  ['fft', fftDef],
  ['interval2bpm', bpmDef]
];

for (const [type, def] of sampleRateNodes) {
  const samplerate = def.params.find(param => param.id === 'samplerate');
  assert.ok(samplerate, `${type} should expose a sample rate parameter`);
  assert.equal(samplerate.type, 'number');
  assert.equal(samplerate.default, '');
  assert.equal(samplerate.optional, true);
}

function assertDifferent(actual, expected, message) {
  assert.notDeepEqual(actual, expected, message);
}

const step = [0, 0, 1, 1, 1, 1];
assertDifferent(
  lowpassProcess(() => step, { cutoff: 1, order: 1, samplerate: 10 }, { sampleRate: 1000 }).out,
  lowpassProcess(() => step, { cutoff: 1, order: 1 }, { sampleRate: 1000 }).out,
  'lowpass should prefer its own sample rate parameter'
);

assertDifferent(
  highpassProcess(() => step, { cutoff: 1, order: 1, samplerate: 10 }, { sampleRate: 1000 }).out,
  highpassProcess(() => step, { cutoff: 1, order: 1 }, { sampleRate: 1000 }).out,
  'highpass should prefer its own sample rate parameter'
);

assertDifferent(
  firProcess(() => step, { cutoff: 1, taps: 5, samplerate: 10 }, { sampleRate: 1000 }).out,
  firProcess(() => step, { cutoff: 1, taps: 5 }, { sampleRate: 1000 }).out,
  'FIR should prefer its own sample rate parameter'
);

const spectrum = fftProcess(() => [1, 0, -1, 0], { size: 4, samplerate: 8 }, { sampleRate: 1000 }).out;
assert.deepEqual(spectrum._xValues, [0, 2, 4], 'FFT frequency axis should use the node sample rate parameter');

assert.deepEqual(
  bpmProcess(() => [4], { samplerate: 8 }, { sampleRate: 1000 }).out,
  [120],
  'interval to BPM should use the node sample rate parameter'
);

assert.deepEqual(
  bpmProcess(() => [4], { samplerate: '' }, { sampleRate: 10 }).out,
  [150],
  'blank sample rate should follow the execution context'
);

console.log('sample-rate node tests passed');
