// Median Window Node: sliding window median
import { median } from './_utils.js';

export const def = {
  type: 'medianwin',
  title: '中值窗口', titleEn: 'Median Window',
  category: '窗口统计', categoryEn: 'Window Statistics',
  color: '#8e44ad',
  sidebar: '中值窗口', sidebarEn: 'Median Window',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 5 },
    { id: '_info', label: '', type: 'info', default: '输出窗口内中位数。比均值更抗孤立尖峰干扰，适合去除椒盐噪声。', defaultEn: 'Outputs the window median. More robust against isolated spikes than mean, suitable for removing salt-and-pepper noise.' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const winSize = Math.max(1, Math.floor(params.size || 5));
  const half = Math.floor(winSize / 2);
  const out = [];
  for (let i = 0; i < inp.length; i++) {
    const window = [];
    for (let j = -half; j <= half; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < inp.length) window.push(inp[idx]);
    }
    window.sort((a, b) => a - b);
    out.push(window[Math.floor(window.length / 2)]);
  }
  return { out };
}
