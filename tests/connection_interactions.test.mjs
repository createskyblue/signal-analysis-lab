import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

assert.match(
  appSource,
  /hit\.addEventListener\('dblclick'/,
  'connection hit area should support double-click deletion'
);

assert.match(
  appSource,
  /removeConnection\(conn\)/,
  'connection deletion should go through the shared removeConnection helper'
);

assert.match(
  styleSource,
  /\.viewport\s*\{[^}]*pointer-events:\s*none/,
  'viewport should not block mouse events from reaching connection hit paths'
);

assert.match(
  styleSource,
  /\.node\s*\{[^}]*pointer-events:\s*auto/,
  'nodes should remain interactive when the viewport itself ignores pointer events'
);

assert.match(
  styleSource,
  /\.connections-svg \.conn-hit\s*\{[^}]*pointer-events:\s*stroke/,
  'connection hit paths should receive pointer events along their stroke'
);

console.log('connection interaction tests passed');
