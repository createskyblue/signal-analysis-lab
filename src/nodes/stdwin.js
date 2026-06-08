// Sliding Std Dev Node
export const def = {
  type: 'stdwin',
  title: '滑动标准差', titleEn: 'Sliding Std Dev',
  category: '窗口统计', categoryEn: 'Window Statistics',
  color: '#98c379',
  sidebar: '滑动标准差', sidebarEn: 'Sliding Std Dev',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 16 },
    { id: '_info', label: '', type: 'info', default: '窗口内信号标准差，衡量局部波动强度。窗口越大越平滑。', defaultEn: 'Standard deviation within the window, measuring local fluctuation intensity. Larger windows give smoother output.' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  if (!inp.length) return { out: [] };
  const size = Math.max(2, Math.floor(params.size || 16));
  const half = Math.floor(size / 2);
  const out = [];
  for (let i = 0; i < inp.length; i++) {
    let sum = 0, sumSq = 0, cnt = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < inp.length) { const v = inp[j]; sum += v; sumSq += v * v; cnt++; }
    }
    const mean = cnt ? sum / cnt : 0;
    out.push(cnt > 1 ? Math.sqrt(Math.max(0, sumSq / cnt - mean * mean)) : 0);
  }
  return { out };
}
