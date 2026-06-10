import assert from 'node:assert/strict';
import { createIqDemoBlueprint } from '../src/demo.js';
import { process as signalgenProcess } from '../src/nodes/signalgen.js';
import { process as multiplierProcess } from '../src/nodes/multiplier.js';
import { process as subtractorProcess } from '../src/nodes/subtractor.js';
import { process as lowpassProcess } from '../src/nodes/lowpass.js';
import { process as probeProcess } from '../src/nodes/probe.js';

const demo = createIqDemoBlueprint();

assert.equal(demo.sampleRate, 1000);
assert.ok(demo.nodes.length >= 16, 'IQ demo should build a complete modulation and demodulation flow');

const byKey = Object.fromEntries(demo.nodes.map(node => [node.key, node]));
for (const key of [
  'iBaseband',
  'qBaseband',
  'iCarrier',
  'qCarrier',
  'iModulator',
  'qModulator',
  'rfCombiner',
  'iDemodMixer',
  'qDemodMixer',
  'iRecoveryFilter',
  'qRecoveryFilter',
  'iGain',
  'qGain',
  'rfProbe',
  'iRecoveredProbe',
  'qRecoveredProbe'
]) {
  assert.ok(byKey[key], `missing demo node: ${key}`);
}

assert.equal(demo.nodes.some(node => node.type === 'custom'), false, 'IQ demo should use built-in nodes instead of custom code');
assert.equal(byKey.iBaseband.type, 'signalgen');
assert.equal(byKey.iBaseband.params.frequency, 4);
assert.equal(byKey.qBaseband.type, 'signalgen');
assert.equal(byKey.qBaseband.params.frequency, 6);

assert.equal(byKey.iCarrier.type, 'signalgen');
assert.equal(byKey.iCarrier.params.waveform, '正弦波');
assert.equal(byKey.iCarrier.params.frequency, 80);
assert.equal(byKey.iCarrier.params.phase, 90);
assert.equal(byKey.qCarrier.type, 'signalgen');
assert.equal(byKey.qCarrier.params.phase, 0);

assert.equal(byKey.iRecoveryFilter.params.cutoff, 20);
assert.equal(byKey.qRecoveryFilter.params.cutoff, 20);
assert.equal(byKey.qGain.params.value, -2);
assert.equal(byKey.rfProbe.label, 'IQ调制信号');
assert.equal(byKey.iRecoveredProbe.label, '解调 I 路');
assert.equal(byKey.qRecoveredProbe.label, '解调 Q 路');

const hasConnection = (from, fromPort, to, toPort) => demo.connections.some(conn =>
  conn.from === from && conn.fromPort === fromPort && conn.to === to && conn.toPort === toPort
);

assert.ok(hasConnection('iBaseband', 'out', 'iBaseProbe', 'in'));
assert.ok(hasConnection('qBaseband', 'out', 'qBaseProbe', 'in'));
assert.ok(hasConnection('iBaseProbe', 'out', 'iModulator', 'a'));
assert.ok(hasConnection('qBaseProbe', 'out', 'qModulator', 'a'));
assert.ok(hasConnection('iCarrier', 'out', 'iModulator', 'b'));
assert.ok(hasConnection('qCarrier', 'out', 'qModulator', 'b'));
assert.ok(hasConnection('iModulator', 'out', 'rfCombiner', 'a'));
assert.ok(hasConnection('qModulator', 'out', 'rfCombiner', 'b'));
assert.ok(hasConnection('rfCombiner', 'out', 'rfProbe', 'in'));
assert.ok(hasConnection('rfProbe', 'out', 'iDemodMixer', 'a'));
assert.ok(hasConnection('rfProbe', 'out', 'qDemodMixer', 'a'));
assert.ok(hasConnection('iRecoveryFilter', 'out', 'iGain', 'a'));
assert.ok(hasConnection('qRecoveryFilter', 'out', 'qGain', 'a'));
assert.ok(hasConnection('iGain', 'out', 'iRecoveredProbe', 'in'));
assert.ok(hasConnection('qGain', 'out', 'qRecoveredProbe', 'in'));

const sampleRate = demo.sampleRate;
const iBaseband = signalgenProcess(() => [], byKey.iBaseband.params, { sampleRate }).out;
const qBaseband = signalgenProcess(() => [], byKey.qBaseband.params, { sampleRate }).out;
const iBaseObserved = probeProcess(() => iBaseband, {}, { sampleRate }).out;
const qBaseObserved = probeProcess(() => qBaseband, {}, { sampleRate }).out;
const iCarrier = signalgenProcess(() => [], byKey.iCarrier.params, { sampleRate }).out;
const qCarrier = signalgenProcess(() => [], byKey.qCarrier.params, { sampleRate }).out;
const iMod = multiplierProcess(port => port === 'a' ? iBaseObserved : iCarrier, {}, { sampleRate }).out;
const qMod = multiplierProcess(port => port === 'a' ? qBaseObserved : qCarrier, {}, { sampleRate }).out;
const rf = subtractorProcess(port => port === 'a' ? iMod : qMod, {}, { sampleRate }).out;
const rfObserved = probeProcess(() => rf, {}, { sampleRate }).out;
const iMixed = multiplierProcess(port => port === 'a' ? rfObserved : iCarrier, {}, { sampleRate }).out;
const qMixed = multiplierProcess(port => port === 'a' ? rfObserved : qCarrier, {}, { sampleRate }).out;
const iRecovered = multiplierProcess(
  port => port === 'a'
    ? lowpassProcess(() => iMixed, byKey.iRecoveryFilter.params, { sampleRate }).out
    : [],
  byKey.iGain.params,
  { sampleRate }
).out;
const qRecovered = multiplierProcess(
  port => port === 'a'
    ? lowpassProcess(() => qMixed, byKey.qRecoveryFilter.params, { sampleRate }).out
    : [],
  byKey.qGain.params,
  { sampleRate }
).out;

function correlation(a, b, start = 300, lag = 0) {
  const x = [];
  const y = [];
  for (let i = start; i < a.length; i++) {
    const j = i + lag;
    if (j >= start && j < b.length) {
      x.push(a[i]);
      y.push(b[j]);
    }
  }
  const xMean = x.reduce((sum, value) => sum + value, 0) / x.length;
  const yMean = y.reduce((sum, value) => sum + value, 0) / y.length;
  let numerator = 0, xEnergy = 0, yEnergy = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - xMean;
    const dy = y[i] - yMean;
    numerator += dx * dy;
    xEnergy += dx * dx;
    yEnergy += dy * dy;
  }
  return numerator / Math.sqrt(xEnergy * yEnergy);
}

function bestCorrelation(a, b) {
  let best = 0;
  for (let lag = -120; lag <= 120; lag++) {
    best = Math.max(best, correlation(a, b, 300, lag));
  }
  return best;
}

assert.ok(bestCorrelation(iBaseband, iRecovered) > 0.95, 'recovered I should track original I baseband');
assert.ok(bestCorrelation(qBaseband, qRecovered) > 0.95, 'recovered Q should track original Q baseband');

console.log('demo tests passed');
