// FIR Linear Phase Filter Node (Hamming-windowed sinc lowpass)
import { getSampleRate } from './_utils.js';

export const def = {
  type: 'firlinear',
  title: 'FIR 线性相位滤波器', titleEn: 'FIR Linear Phase Filter',
  category: '滤波器', categoryEn: 'Filters',
  color: '#5dade2',
  sidebar: 'FIR 线性相位', sidebarEn: 'FIR Linear Phase',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'samplerate', label: '采样率 (Hz)', labelEn: 'Sample Rate (Hz)', type: 'number', default: '', optional: true },
    { id: 'cutoff', label: '截止频率 (Hz)', labelEn: 'Cutoff Freq (Hz)', type: 'number', default: 50 },
    { id: 'taps', label: '抽头数量 (奇数)', labelEn: 'Taps (odd)', type: 'number', default: 31 },
    { id: '_info', label: '', type: 'info', default: 'Hamming 窗 sinc 低通 FIR。抽头数越大衰减越陡但计算量也越大。\n<strong>与 RC 滤波器不同：</strong>FIR 是线性相位（各频率延迟一致），适合对波形形状有要求的场景。', defaultEn: 'Hamming-windowed sinc lowpass FIR. More taps = steeper roll-off but higher computation cost.\n<strong>Unlike RC filters:</strong> FIR has linear phase (uniform delay across frequencies), suitable when waveform shape matters.' }
  ]
};

function firCoeffs(cutoff, sampleRate, taps) {
  const n = Math.max(3, taps);
  const fc = Math.max(0.000001, Math.min(cutoff / sampleRate, 0.499999));
  const mid = (n - 1) / 2;
  const coeffs = [];
  for (let i = 0; i < n; i++) {
    const x = i - mid;
    const sinc = x === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * x) / (Math.PI * x);
    const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
    coeffs.push(sinc * window);
  }
  const sum = coeffs.reduce((acc, v) => acc + v, 0);
  if (sum !== 0) for (let i = 0; i < coeffs.length; i++) coeffs[i] /= sum;
  return coeffs;
}

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const rawTaps = Math.max(3, Math.floor(params.taps || 31));
  const taps = rawTaps % 2 === 0 ? rawTaps + 1 : rawTaps;
  const cutoff = params.cutoff || 50;
  const sampleRate = getSampleRate(params, ctx);
  if (!inp.length || !taps) return { out: [] };
  const coeffs = firCoeffs(cutoff, sampleRate, taps);
  const center = Math.floor(coeffs.length / 2);
  const out = [];
  for (let i = 0; i < inp.length; i++) {
    let acc = 0;
    for (let k = 0; k < coeffs.length; k++) {
      const idx = i + k - center;
      if (idx >= 0 && idx < inp.length) acc += inp[idx] * coeffs[k];
    }
    out.push(acc);
  }
  return { out };
}
