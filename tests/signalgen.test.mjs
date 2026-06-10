import assert from 'node:assert/strict';
import { process, def } from '../src/nodes/signalgen.js';

const sampleRate = 4;
const emptyInput = () => [];

function generate(params) {
  return process(emptyInput, {
    frequency: 1,
    high: 1,
    low: -1,
    length: 4,
    phase: 0,
    ...params
  }, { sampleRate }).out;
}

function generateWithSampleRate(params, rate) {
  return process(emptyInput, {
    frequency: 1,
    high: 1,
    low: -1,
    length: rate,
    phase: 0,
    ...params
  }, { sampleRate: rate }).out;
}

function assertArrayClose(actual, expected, epsilon = 1e-12) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => {
    assert.ok(
      Math.abs(value - expected[index]) <= epsilon,
      `index ${index}: expected ${expected[index]}, got ${value}`
    );
  });
}

assert.ok(def.params.some(param => param.id === 'waveform'), 'waveform parameter should exist');
assert.ok(def.params.some(param => param.id === 'phase'), 'phase parameter should exist');

assertArrayClose(generate({ waveform: '正弦波', phase: 90 }), [1, 0, -1, 0]);
assertArrayClose(generate({ waveform: '矩形波' }), [1, 1, -1, -1]);
assertArrayClose(generate({ waveform: '三角波' }), [0, 1, 0, -1]);
assertArrayClose(generateWithSampleRate({ waveform: '三角波' }, 8), [0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5]);
assertArrayClose(generate({ waveform: '锯齿波' }), [-1, -0.5, 0, 0.5]);

console.log('signalgen tests passed');
