// Avg Win Node: sliding window average
export const def = {
  type: 'avgwin',
  title: 'Avg Win',
  category: '窗口统计', categoryEn: 'Window Statistics',
  color: '#1abc9c',
  sidebar: 'Avg Win',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 5 }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const winSize = Math.max(1, Math.floor(params.size || 5));
  const half = Math.floor(winSize / 2);
  const out = [];
  for (let i = 0; i < inp.length; i++) {
    let sum = 0, cnt = 0;
    for (let j = -half; j <= half; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < inp.length) { sum += inp[idx]; cnt++; }
    }
    out.push(sum / cnt);
  }
  return { out };
}
