// Hampel Filter Node (MAD-based outlier removal)
import { median } from './_utils.js';

export const def = {
  type: 'madfilter',
  title: 'Hampel滤波器', titleEn: 'Hampel Filter',
  category: '滤波器', categoryEn: 'Filters',
  color: '#ce9178',
  sidebar: 'Hampel滤波', sidebarEn: 'Hampel Filter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [
    { id: 'out', label: '滤波结果', labelEn: 'Filtered' },
    { id: 'mad', label: 'MAD' }
  ],
  params: [
    { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 7 },
    { id: 'threshold', label: '阈值倍数', labelEn: 'Threshold Factor', type: 'number', default: 3 },
    { id: 'scale', label: 'MAD 缩放系数', labelEn: 'MAD Scale', type: 'number', default: 1.4826 },
    { id: '_info', label: '', type: 'info', default: '对每个采样点，取窗口内中位数 med 和中位绝对偏差 MAD。若 |x-med| > 阈值×scale×MAD，则替换为中位数。\n<strong>阈值=0 时</strong>退化为纯中值滤波。scale=1.4826 使 MAD≈标准差（正态假设）。\n<strong>输出</strong> out=滤波结果, mad=局部 MAD 轨迹（用于调参）。', defaultEn: 'For each sample, computes the window median (med) and Median Absolute Deviation (MAD). If |x-med| > threshold×scale×MAD, the sample is replaced by the median.\n<strong>threshold=0</strong> degenerates to pure median filter. scale=1.4826 makes MAD ≈ standard deviation (under normality assumption).\n<strong>Outputs:</strong> out=filtered result, mad=local MAD trace (for parameter tuning).' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  if (!inp.length) return { out: [], mad: [] };
  const size = Math.max(1, Math.floor(params.size || 1));
  const half = Math.floor(size / 2);
  const threshold = Math.max(0, params.threshold !== undefined ? params.threshold : 3);
  const scale = Math.max(0, params.scale !== undefined ? params.scale : 1.4826);
  const filtered = [];
  const madTrace = [];
  for (let i = 0; i < inp.length; i++) {
    const window = [];
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < inp.length) window.push(Number(inp[j]) || 0);
    }
    const med = median(window);
    const deviations = window.map(v => Math.abs(v - med));
    const mad = median(deviations);
    const sigma = scale * mad;
    const current = Number(inp[i]) || 0;
    madTrace.push(mad);
    filtered.push(Math.abs(current - med) > threshold * sigma ? med : current);
  }
  return { out: filtered, mad: madTrace };
}
