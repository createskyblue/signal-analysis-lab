import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

assert.match(appSource, /downloadChartItemCsv/, 'chart items should have a CSV export method');
assert.match(appSource, /buildChartCsvRows/, 'chart export should build CSV rows from chart data');
assert.match(appSource, /chart-export-button/, 'chart item header should render an export button');
assert.match(appSource, /exportBtn\.textContent = I18N\.t\('导出'\)/, 'chart export button should be labeled 导出');
assert.match(appSource, /exportBtn\.onclick = \(e\) => \{ e\.stopPropagation\(\); this\.downloadChartItemCsv\(chartItem\); \}/, 'chart export button should download only its chart data');
assert.doesNotMatch(appSource, /'x,y'/, 'X-Y chart export should not include a header row');
assert.doesNotMatch(appSource, /`\$\{axis\.label \|\| 'x'\},value`/, 'axis-based chart export should not include a header row');
assert.doesNotMatch(appSource, /'index,value'/, 'sample chart export should not include an index header');
assert.doesNotMatch(appSource, /rows\.push\(`\$\{i\},/, 'sample chart export should not include index values');
assert.match(appSource, /lastSimulationTimestamp/, 'chart export filename should include the latest simulation time');
assert.match(appSource, /const exportTimestamp = this\.formatTimestamp\(\)/, 'chart export filename should include the export click time');
assert.match(appSource, /仿真_\$\{simulationTimestamp\}_导出_\$\{exportTimestamp\}/, 'chart export filename should clearly include both timestamps');
assert.match(styleSource, /\.chart-export-button/, 'chart export button should have a dedicated style');

console.log('chart export tests passed');
