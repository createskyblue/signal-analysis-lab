import assert from 'node:assert/strict';
import { def, process } from '../src/nodes/limiter.js';

const paramIds = def.params.map(param => param.id);

assert.ok(paramIds.includes('mode'), 'limiter should expose a mode selector');
assert.deepEqual(def.params.find(param => param.id === 'mode').options, ['限位', '异常值']);
assert.ok(paramIds.indexOf('max') < paramIds.indexOf('min'), 'max input should appear above min input');
assert.ok(paramIds.includes('outlierValue'), 'limiter should expose an outlier value input');
assert.equal(def.params.find(param => param.id === 'outlierValue').enabledWhen.value, '异常值');

const input = [-2, -1, 0, 1, 2];
assert.deepEqual(
  process(port => port === 'in' ? input : [], { mode: '限位', max: 1, min: -1 }).out,
  [-1, -1, 0, 1, 1],
  'limit mode should clamp values to min and max'
);

assert.deepEqual(
  process(port => port === 'in' ? input : [], { mode: '异常值', max: 1, min: -1, outlierValue: 999 }).out,
  [999, -1, 0, 1, 999],
  'outlier mode should replace values outside the range with the configured outlier value'
);

assert.deepEqual(
  process(port => port === 'in' ? input : [], { max: 1, min: -1 }).out,
  [-1, -1, 0, 1, 1],
  'existing limiter nodes should keep clamping by default'
);

console.log('limiter tests passed');
