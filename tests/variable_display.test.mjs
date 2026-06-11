import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { def as displayDef, process as displayProcess } from '../src/nodes/variabledisplay.js';
import { NODE_DEFS, NODE_PROCESS, ALL_NODES } from '../src/nodes/index.js';

const appSource = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

assert.ok(ALL_NODES.some(mod => mod.def.type === 'variabledisplay'), 'variable display node should be shown in the node registry');
assert.equal(NODE_DEFS.variabledisplay, displayDef, 'variable display node definition should be registered');
assert.equal(NODE_PROCESS.variabledisplay, displayProcess, 'variable display node process should be registered');

assert.equal(displayDef.type, 'variabledisplay');
assert.deepEqual(displayDef.inputs.map(input => input.id), ['in']);
assert.deepEqual(displayDef.outputs.map(output => output.id), ['out']);
assert.ok(displayDef.params.some(param => param.id === 'variableName'), 'variable display should expose a visible variable name filter');
assert.ok(displayDef.params.some(param => param.type === 'variableReadout'), 'variable display should expose a readout box');
const displayed = displayProcess(() => [1, 2, 3], { variableName: 'gain' }, { variables: new Map([['gain', 2]]) });
assert.deepEqual(displayed.out, [1, 2, 3], 'variable display should pass the pipeline signal through');
assert.equal(displayed.readout, '2');
assert.equal(
  displayProcess(() => [], { variableName: 'missing' }, { variables: new Map([['gain', 2]]) }).readout,
  '未定义',
  'named variable display should not repeat the variable name'
);
assert.equal(
  displayProcess(() => [], { variableName: '' }, { variables: new Map([['b', 2], ['a', 1]]) }).readout,
  'a = 1\nb = 2',
  'blank variable name should display all variables in pipeline state'
);

assert.match(appSource, /renderVariableReadout/, 'app should render variable readout boxes');
assert.match(appSource, /ctx\.variables = this\.variableValues/, 'node execution context should include collected variables');
assert.match(appSource, /node\.type === 'variable'/, 'app should update variable state when variable nodes execute');
assert.match(appSource, /node\.type === 'variabledisplay'/, 'app should update the variable display when display nodes execute');
assert.doesNotMatch(appSource, /n\.type === 'variabledisplay'/, 'variable display should not be a source node without pipeline input');

console.log('variable display tests passed');
