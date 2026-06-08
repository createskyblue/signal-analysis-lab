// Max Win Node: sliding window maximum
export const def = {
  type: 'maxwin',
  title: 'Max Win',
  category: '窗口统计', categoryEn: 'Window Statistics',
  color: '#c0392b',
  sidebar: 'Max Win',
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
    let max = -Infinity;
    for (let j = -half; j <= half; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < inp.length && inp[idx] > max) max = inp[idx];
    }
    out.push(max);
  }
  return { out };
}
