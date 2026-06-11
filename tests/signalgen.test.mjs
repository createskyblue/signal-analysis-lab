import assert from 'node:assert/strict';
import { process, def } from '../src/nodes/signalgen.js';

const sampleRate = 4;
const emptyInput = () => [];

function generate(params) {
  return process(emptyInput, {
    frequency: 1,
    period: 1,
    rateMode: '频率',
    high: 1,
    low: -1,
    levelMode: '低高电平',
    offset: 0,
    amplitude: 1,
    length: 4,
    phase: 0,
    delay: 0,
    phaseMode: '相位',
    duty: 50,
    symmetry: 50,
    pulseWidthMode: '占空比',
    pulseWidth: 0.5,
    riseTime: 0,
    fallTime: 0,
    samplerate: sampleRate,
    lengthMode: '点数',
    duration: 1,
    noiseMean: 0,
    noiseStd: 0,
    noiseSeed: 1,
    ...params
  }, { sampleRate }).out;
}

function generateWithSampleRate(params, rate) {
  return process(emptyInput, {
    frequency: 1,
    period: 1,
    rateMode: '频率',
    high: 1,
    low: -1,
    levelMode: '低高电平',
    offset: 0,
    amplitude: 1,
    length: rate,
    phase: 0,
    delay: 0,
    phaseMode: '相位',
    duty: 50,
    symmetry: 50,
    pulseWidthMode: '占空比',
    pulseWidth: 0.5,
    riseTime: 0,
    fallTime: 0,
    samplerate: rate,
    lengthMode: '点数',
    duration: 1,
    noiseMean: 0,
    noiseStd: 0,
    noiseSeed: 1,
    ...params
  }, { sampleRate: rate }).out;
}

function generateAll(params, rate = sampleRate) {
  return process(emptyInput, {
    frequency: 1,
    period: 1,
    rateMode: '频率',
    high: 1,
    low: -1,
    levelMode: '低高电平',
    offset: 0,
    amplitude: 1,
    length: rate,
    phase: 0,
    delay: 0,
    phaseMode: '相位',
    duty: 50,
    symmetry: 50,
    pulseWidthMode: '占空比',
    pulseWidth: 0.5,
    riseTime: 0,
    fallTime: 0,
    samplerate: rate,
    lengthMode: '点数',
    duration: 1,
    noiseMean: 0,
    noiseStd: 0,
    noiseSeed: 1,
    ...params
  }, { sampleRate: rate });
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

function assertVisibleWhen(paramId, condition) {
  const param = def.params.find(item => item.id === paramId);
  assert.ok(param, `${paramId} parameter should exist`);
  assert.deepEqual(param.enabledWhen, condition);
}

assert.ok(def.params.some(param => param.id === 'waveform'), 'waveform parameter should exist');
assert.ok(def.params.some(param => param.id === 'phase'), 'phase parameter should exist');
assert.ok(def.params.some(param => param.id === 'rateMode'), 'rate mode parameter should exist');
assert.ok(def.params.some(param => param.id === 'period'), 'period parameter should exist');
assert.ok(def.params.some(param => param.id === 'levelMode'), 'level mode parameter should exist');
assert.ok(def.params.some(param => param.id === 'offset'), 'offset parameter should exist');
assert.ok(def.params.some(param => param.id === 'amplitude'), 'amplitude parameter should exist');
assert.ok(def.params.some(param => param.id === 'phaseMode'), 'phase mode parameter should exist');
assert.ok(def.params.some(param => param.id === 'delay'), 'delay parameter should exist');
assert.ok(def.params.some(param => param.id === 'duty'), 'duty parameter should exist');
assert.ok(def.params.some(param => param.id === 'symmetry'), 'symmetry parameter should exist');
assert.ok(def.params.some(param => param.id === 'pulseWidthMode'), 'pulse width mode parameter should exist');
assert.ok(def.params.some(param => param.id === 'pulseWidth'), 'pulse width parameter should exist');
assert.ok(def.params.some(param => param.id === 'riseTime'), 'rise time parameter should exist');
assert.ok(def.params.some(param => param.id === 'fallTime'), 'fall time parameter should exist');
assert.ok(def.params.find(param => param.id === 'waveform').options.includes('脉冲波'), 'pulse waveform option should exist');
assert.ok(def.params.find(param => param.id === 'waveform').options.includes('噪声'), 'noise waveform option should exist');
assert.ok(def.params.some(param => param.id === 'noiseMean'), 'noise mean parameter should exist');
assert.ok(def.params.some(param => param.id === 'noiseStd'), 'noise std parameter should exist');
assert.ok(def.params.some(param => param.id === 'samplerate'), 'sample rate parameter should exist');
assert.ok(def.params.some(param => param.id === 'lengthMode'), 'length mode parameter should exist');
assert.ok(def.params.some(param => param.id === 'duration'), 'duration parameter should exist');
assert.deepEqual(def.outputs.map(output => output.id), ['out'], 'signal generator should expose one output port');
assert.deepEqual(def.params.find(param => param.id === 'rateMode').enabledWhen.values, ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波']);
assert.deepEqual(def.params.find(param => param.id === 'phaseMode').enabledWhen.values, ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波']);
assert.deepEqual(def.params.find(param => param.id === 'levelMode').enabledWhen.values, ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波']);
assertVisibleWhen('frequency', { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'rateMode', value: '频率' }] });
assertVisibleWhen('period', { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'rateMode', value: '周期' }] });
assertVisibleWhen('phase', { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'phaseMode', value: '相位' }] });
assertVisibleWhen('delay', { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'phaseMode', value: '延时' }] });
assertVisibleWhen('high', { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'levelMode', value: '低高电平' }] });
assertVisibleWhen('low', { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'levelMode', value: '低高电平' }] });
assertVisibleWhen('offset', { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'levelMode', value: '偏移幅值' }] });
assertVisibleWhen('amplitude', { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'levelMode', value: '偏移幅值' }] });
assert.deepEqual(def.params.find(param => param.id === 'duty').enabledWhen.values, ['矩形波', '脉冲波']);
assert.equal(def.params.find(param => param.id === 'symmetry').enabledWhen.value, '三角波');
assert.equal(def.params.find(param => param.id === 'pulseWidthMode').enabledWhen.value, '脉冲波');
assert.deepEqual(def.params.find(param => param.id === 'pulseWidth').enabledWhen.all, [
  { param: 'waveform', value: '脉冲波' },
  { param: 'pulseWidthMode', value: '脉宽' }
]);
assert.equal(def.params.find(param => param.id === 'riseTime').enabledWhen.value, '脉冲波');
assert.equal(def.params.find(param => param.id === 'fallTime').enabledWhen.value, '脉冲波');
assert.equal(def.params.find(param => param.id === 'noiseMean').enabledWhen.value, '噪声');
assert.equal(def.params.find(param => param.id === 'noiseStd').enabledWhen.value, '噪声');
assert.equal(def.params.find(param => param.id === 'noiseSeed').enabledWhen.value, '噪声');
assert.equal(def.params.find(param => param.id === 'length').enabledWhen.value, '点数');
assert.equal(def.params.find(param => param.id === 'duration').enabledWhen.value, '时长');

assertArrayClose(generate({ waveform: '正弦波', phase: 90 }), [1, 0, -1, 0]);
assertArrayClose(generate({ waveform: '矩形波' }), [1, 1, -1, -1]);
assertArrayClose(generate({ waveform: '三角波' }), [0, 1, 0, -1]);
assertArrayClose(generateWithSampleRate({ waveform: '三角波' }, 8), [0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5]);
assertArrayClose(generateWithSampleRate({ waveform: '三角波', symmetry: 25 }, 8), [0, 1, 2 / 3, 1 / 3, 0, -1, -2 / 3, -1 / 3]);
assertArrayClose(generate({ waveform: '锯齿波' }), [-1, -0.5, 0, 0.5]);
assertArrayClose(generate({ rateMode: '周期', period: 1 }), [0, 1, 0, -1]);
assertArrayClose(generate({ rateMode: '周期', period: 0.5, samplerate: 8 }), [0, 1, 0, -1]);
assertArrayClose(generate({ levelMode: '偏移幅值', offset: 2, amplitude: 3 }), [2, 5, 2, -1]);
assertArrayClose(generate({ phaseMode: '延时', delay: 0.25 }), [-1, 0, 1, 0]);
assertArrayClose(generate({ phaseMode: '延时', delay: 0.125, frequency: 2, samplerate: 8 }), [-1, 0, 1, 0]);
assertArrayClose(generateWithSampleRate({ waveform: '矩形波', duty: 25 }, 8), [1, 1, -1, -1, -1, -1, -1, -1]);
assertArrayClose(generateWithSampleRate({ waveform: '脉冲波', duty: 25 }, 8), [1, 1, -1, -1, -1, -1, -1, -1]);
assertArrayClose(generateWithSampleRate({ waveform: '脉冲波', pulseWidthMode: '脉宽', pulseWidth: 0.25 }, 8), [1, 1, -1, -1, -1, -1, -1, -1]);
assertArrayClose(generateWithSampleRate({ waveform: '脉冲波', duty: 50, riseTime: 0.25, fallTime: 0.25 }, 8), [-1, 0, 1, 1, 1, 0, -1, -1]);

const sineResult = generateAll({ waveform: '正弦波', noiseMean: 0.5, noiseStd: 0 }, 8);
assert.deepEqual(Object.keys(sineResult), ['out'], 'signal generator should return only the out channel');

const meanOnlyNoise = generateAll({ waveform: '噪声', noiseMean: 0.5, noiseStd: 0 }, 8);
assertArrayClose(meanOnlyNoise.out, new Array(8).fill(0.5));
assert.deepEqual(Object.keys(meanOnlyNoise), ['out'], 'noise mode should use the single out channel');

const durationSignal = generateAll({ waveform: '正弦波', samplerate: 4, lengthMode: '时长', duration: 2, frequency: 1 }, 999);
assert.equal(durationSignal.out.length, 8, 'duration mode should derive output length from sample rate and seconds');
assertArrayClose(durationSignal.out.slice(0, 4), [0, 1, 0, -1]);

const noisy = generateAll({ waveform: '噪声', noiseMean: 0.5, noiseStd: 0.25, noiseSeed: 123 }, 8);
assert.equal(noisy.out.length, 8);
assert.ok(noisy.out.some(value => value !== 0.5), 'noise output should vary around the mean when std is non-zero');
assert.ok(noisy.out.every(Number.isFinite), 'noise output should contain finite values');

console.log('signalgen tests passed');
