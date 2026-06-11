import assert from 'node:assert/strict';
import { def, process } from '../src/nodes/probe.js';

const modeParam = def.params.find(param => param.id === 'displayMode');
assert.ok(modeParam, 'oscilloscope should expose a display mode parameter');
assert.equal(modeParam.default, 'Y-T');
assert.deepEqual(modeParam.options, ['Y-T', 'X-Y']);
assert.equal(modeParam.affectsPorts, true);

assert.equal(def.inputs[0].id, 'in');
assert.equal(def.outputs[0].id, 'out');

const input = [1, 2, 3];
const output = process(port => port === 'in' ? input : [], { displayMode: 'Y-T' }, {});
assert.deepEqual(output.out, input);

console.log('probe tests passed');
