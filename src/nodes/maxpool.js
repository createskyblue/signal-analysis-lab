// Max Pool Node: max pooling downsampling
export const def = {
  type: 'maxpool',
  title: 'Max Pool',
  category: '降采样', categoryEn: 'Downsampling',
  color: '#27ae60',
  sidebar: 'Max Pool',
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
    let max = -Infinity;
    for (let j = 0; j < poolSize && i + j < inp.length; j++) { if (inp[i + j] > max) max = inp[i + j]; }
    out.push(max);
  }
  return { out };
}
