import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

assert.match(appSource, /paramWrap\.className = 'param-field'/, 'parameters should render in hideable field wrappers');
assert.match(appSource, /field\.style\.display = hidden \? 'none' : ''/, 'inactive enabledWhen parameters should be hidden');
assert.match(appSource, /condition\.all.*every/, 'parameter visibility should support combined conditions');
assert.match(appSource, /condition\.values.*includes/, 'parameter visibility should support multi-value conditions');
assert.match(appSource, /this\.syncParamControlStates\(node, node\.el\.querySelector\('\.node-body'\)\)/, 'mode changes should resync visibility across the full node body');
assert.match(appSource, /else this\.syncParamControlStates\(node, node\.el\.querySelector\('\.node-body'\)\)/, 'checkbox changes should resync visibility across the full node body');
assert.doesNotMatch(appSource, /control\.disabled = disabled/, 'inactive enabledWhen parameters should not be shown as disabled controls');
assert.match(appSource, /node\.type === 'signalgen'/, 'signal generator should publish its configured sample rate into the execution context');
assert.match(appSource, /this\.sampleRate = this\.getNodeSampleRate\(node, this\.sampleRate \|\| 1000\)/, 'signal generator sample rate should fall back safely when unset');

console.log('parameter visibility tests passed');
