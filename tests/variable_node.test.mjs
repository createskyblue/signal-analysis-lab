import assert from 'node:assert/strict';
import { def as inputDef } from '../src/nodes/input.js';
import { def as variableDef, process as variableProcess } from '../src/nodes/variable.js';
import { NODE_DEFS, NODE_PROCESS, ALL_NODES } from '../src/nodes/index.js';

assert.equal(inputDef.params.some(param => param.id === 'samplerate'), false, 'CSV input should not expose a sample rate parameter');

assert.ok(ALL_NODES.some(mod => mod.def.type === 'variable'), 'variable node should be shown in the node registry');
assert.equal(NODE_DEFS.variable, variableDef, 'variable node definition should be registered');
assert.equal(NODE_PROCESS.variable, variableProcess, 'variable node process should be registered');

assert.equal(variableDef.type, 'variable');
assert.deepEqual(variableDef.inputs.map(input => input.id), ['len']);
assert.deepEqual(variableDef.outputs.map(output => output.id), ['out']);
assert.ok(variableDef.params.some(param => param.id === 'name'), 'variable node should expose a variable name');
assert.ok(variableDef.params.some(param => param.id === 'value'), 'variable node should expose a numeric value');

const value = variableProcess(() => [], { name: 'gain', value: 2.5 }, { sampleRate: 1000 });
assert.deepEqual(value, { out: [2.5] });

const repeated = variableProcess(port => port === 'len' ? [1, 2, 3, 4] : [], { name: 'gain', value: 2.5 }, { sampleRate: 1000 });
assert.deepEqual(repeated, { out: [2.5, 2.5, 2.5, 2.5] });

const invalid = variableProcess(() => [], { name: 'gain', value: 'not a number' }, { sampleRate: 1000 });
assert.deepEqual(invalid, { out: [0] });

console.log('variable node tests passed');
