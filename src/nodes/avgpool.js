// Avg Pool Node: average pooling downsampling
export const def = {
  type: 'avgpool',
  title: 'Avg Pool',
  category: '降采样', categoryEn: 'Downsampling',
  color: '#16a085',
  sidebar: 'Avg Pool',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'size', label: '池化大小', labelEn: 'Pool Size', type: 'number', default: 4 }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const poolSize = Math.max(1, Math.floor(params.size || 4));
  const out = [];
  for (let i = 0; i < inp.length; i += poolSize) {
    let sum = 0, cnt = 0;
    for (let j = 0; j < poolSize && i + j < inp.length; j++) { sum += inp[i + j]; cnt++; }
    out.push(sum / cnt);
  }
  return { out };
}
