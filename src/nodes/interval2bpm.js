// Interval→BPM Node
import { getSampleRate } from './_utils.js';

export const def = {
  type: 'interval2bpm',
  title: '间隔→BPM', titleEn: 'Interval→BPM',
  category: '特征提取', categoryEn: 'Feature Extraction',
  color: '#c678dd',
  sidebar: '间隔→BPM', sidebarEn: 'Interval→BPM',
  inputs: [{ id: 'in', label: '间隔输入', labelEn: 'Interval Input' }],
  outputs: [{ id: 'out', label: 'BPM' }],
  params: [
    { id: 'samplerate', label: '采样率 (Hz)', labelEn: 'Sample Rate (Hz)', type: 'number', default: '', optional: true },
    { id: '_info', label: '', type: 'info', default: 'BPM = 60 × 采样率 / 间隔点数。输入为 0 时输出 0；输入为负数/NaN 时保持上一有效值。', defaultEn: 'BPM = 60 × sampleRate / intervalSamples. Outputs 0 when input is 0; holds the last valid value when input is negative or NaN.' }
  ]
};

export function process(getInput, params, ctx) {
  const intervals = getInput('in');
  if (!intervals.length) return { out: [] };
  const sr = getSampleRate(params, ctx, 0);
  const out = [];
  let held = 0;
  for (const raw of intervals) {
    const v = Number(raw);
    if (sr > 0 && Number.isFinite(v) && v > 0) held = 60 * sr / v;
    else if (v === 0) held = 0;
    out.push(held);
  }
  return { out };
}
