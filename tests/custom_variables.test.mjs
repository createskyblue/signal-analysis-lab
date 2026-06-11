import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { def as customDef } from '../src/nodes/custom.js';

const appSource = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const codeParam = customDef.params.find(param => param.id === 'code');

assert.match(appSource, /new Function\('signal', 'sampleRate', 'inputs', 'variables', 'sleep', 'aborted'/, 'custom node should receive variables as an injected argument');
assert.match(appSource, /fn\(signal, this\.sampleRate, customInputs, Object\.fromEntries\(this\.variableValues\), ctx\.sleep, ctx\.aborted\)/, 'custom node should receive the current pipeline variables');
assert.match(codeParam.default, /variables\s+— object/, 'custom node help should document variables');
assert.match(codeParam.default, /variables\.a/, 'custom node help should show variables.name access');

console.log('custom variable tests passed');
