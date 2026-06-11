// FFT Spectrum Node
import { getSampleRate } from './_utils.js';

export const def = {
  type: 'fft',
  title: 'FFT 频谱', titleEn: 'FFT Spectrum',
  category: '频域分析', categoryEn: 'Frequency Domain',
  color: '#dcdcaa',
  sidebar: 'FFT 频谱', sidebarEn: 'FFT Spectrum',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '幅值谱', labelEn: 'Magnitude Spectrum' }],
  params: [
    { id: 'samplerate', label: '采样率 (Hz)', labelEn: 'Sample Rate (Hz)', type: 'number', default: '', optional: true },
    { id: 'size', label: 'FFT 点数', labelEn: 'FFT Points', type: 'number', default: 1024 },
    { id: 'minFreq', label: '最小频率 (Hz)', labelEn: 'Min Freq (Hz)', type: 'number', default: '', optional: true, min: 0 },
    { id: 'maxFreq', label: '最大频率 (Hz)', labelEn: 'Max Freq (Hz)', type: 'number', default: '', optional: true, min: 0 },
    { id: '_info', label: '', type: 'info', default: '计算输入信号的单边幅值谱（FFT 取模）。点数越大频率分辨力越高（Δf=采样率/点数）。\n<strong>频率范围：</strong>最小/最大频率留空时默认显示 0~采样率/2。输出 X 轴单位为 Hz。', defaultEn: 'Computes single-sided magnitude spectrum (FFT magnitude). More points = higher frequency resolution (Δf = sampleRate / points).\n<strong>Frequency range:</strong> When min/max frequency is left empty, defaults to 0 ~ sampleRate/2. Output X-axis is in Hz.' }
  ]
};

function nextPowerOfTwo(value) {
  let n = 1;
  const target = Math.max(2, Math.floor(value || 2));
  while (n < target) n <<= 1;
  return n;
}

function fftInPlace(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = -2 * Math.PI / len;
    const wLenRe = Math.cos(angle), wLenIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let wRe = 1, wIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uRe = re[i + j], uIm = im[i + j];
        const vRe = re[i + j + len / 2] * wRe - im[i + j + len / 2] * wIm;
        const vIm = re[i + j + len / 2] * wIm + im[i + j + len / 2] * wRe;
        re[i + j] = uRe + vRe; im[i + j] = uIm + vIm;
        re[i + j + len / 2] = uRe - vRe; im[i + j + len / 2] = uIm - vIm;
        const nextRe = wRe * wLenRe - wIm * wLenIm;
        wIm = wRe * wLenIm + wIm * wLenRe;
        wRe = nextRe;
      }
    }
  }
}

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  if (!inp.length) return { out: [] };
  const n = nextPowerOfTwo(params.size || inp.length || 2);
  const re = new Array(n).fill(0), im = new Array(n).fill(0);
  for (let i = 0; i < Math.min(inp.length, n); i++) re[i] = Number(inp[i]) || 0;
  fftInPlace(re, im);
  const bins = Math.floor(n / 2) + 1;
  const out = [], freqs = [];
  const sr = getSampleRate(params, ctx);
  const min = params.minFreq === '' || params.minFreq === undefined ? 0 : Number(params.minFreq);
  const max = params.maxFreq === '' || params.maxFreq === undefined ? sr / 2 : Number(params.maxFreq);
  const lo = Math.max(0, Math.min(Number.isFinite(min) ? min : 0, sr / 2));
  const hi = Math.max(0, Math.min(Number.isFinite(max) ? max : sr / 2, sr / 2));
  const rangeMin = Math.min(lo, hi), rangeMax = Math.max(lo, hi);
  for (let k = 0; k < bins; k++) {
    const edgeBin = k === 0 || k === n / 2;
    const scale = edgeBin ? 1 / n : 2 / n;
    const freq = k * sr / n;
    if (freq < rangeMin || freq > rangeMax) continue;
    out.push(Math.hypot(re[k], im[k]) * scale);
    freqs.push(freq);
  }
  out._chartType = 'spectrum';
  out._xValues = freqs;
  out._xUnit = 'Hz';
  out._xLabel = '频率';
  return { out };
}
