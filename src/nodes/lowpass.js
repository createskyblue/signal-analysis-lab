// Lowpass Filter Node (RC)
import { getSampleRate } from './_utils.js';

export const def = {
  type: 'lowpass',
  title: '低通滤波器', titleEn: 'Lowpass Filter',
  category: '滤波器', categoryEn: 'Filters',
  color: '#a569bd',
  sidebar: '低通滤波', sidebarEn: 'Lowpass Filter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'samplerate', label: '采样率 (Hz)', labelEn: 'Sample Rate (Hz)', type: 'number', default: '', optional: true },
    { id: 'cutoff', label: '截止频率 (Hz)', labelEn: 'Cutoff Freq (Hz)', type: 'number', default: 50 },
    { id: 'order', label: '阶数 (1~8)', labelEn: 'Order (1~8)', type: 'number', default: 2, min: 1 },
    { id: '_info', label: '', type: 'info', default: '衰减 ＞截止频率 的信号。阶数越高衰减越陡（每阶 6dB/oct）。阶数升高会略降低有效截止频率。', defaultEn: 'Attenuates signals above the cutoff frequency. Higher orders give steeper roll-off (6dB/oct per stage). Higher orders slightly reduce the effective cutoff frequency.' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const order = Math.max(1, Math.min(8, Math.floor(params.order || 2)));
  const sampleRate = getSampleRate(params, ctx);
  if (!inp.length) return { out: [] };
  let result = inp;
  for (let stage = 0; stage < order; stage++) {
    const rc = 1.0 / ((params.cutoff || 50) * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (rc + dt);
    const out = [result[0]];
    for (let i = 1; i < result.length; i++) {
      out.push(out[i - 1] + alpha * (result[i] - out[i - 1]));
    }
    result = out;
  }
  return { out: result };
}
