// Extreme Window Node: max - min within window (peak-to-peak)
export const def = {
  type: 'extremewin',
  title: '极值窗口', titleEn: 'Extreme Window',
  category: '窗口统计', categoryEn: 'Window Statistics',
  color: '#e67e22',
  sidebar: '极值窗口', sidebarEn: 'Extreme Window',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 5 },
    { id: '_info', label: '', type: 'info', default: '输出窗口内 max-min 差值（峰峰值）。衡量信号局部波动幅度。', defaultEn: 'Outputs the max-min difference (peak-to-peak) within the window. Measures local signal fluctuation amplitude.' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const winSize = Math.max(1, Math.floor(params.size || 5));
  const half = Math.floor(winSize / 2);
  const out = [];
  for (let i = 0; i < inp.length; i++) {
    let min = Infinity, max = -Infinity;
    for (let j = -half; j <= half; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < inp.length) {
        if (inp[idx] < min) min = inp[idx];
        if (inp[idx] > max) max = inp[idx];
      }
    }
    out.push(max - min);
  }
  return { out };
}
