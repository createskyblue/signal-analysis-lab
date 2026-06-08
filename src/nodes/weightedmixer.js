// Weighted Mixer Node: multi-input point-wise weighted sum
export const def = {
  type: 'weightedmixer',
  title: '加权合成器', titleEn: 'Weighted Mixer',
  category: '流程控制', categoryEn: 'Flow Control',
  color: '#d7ba7d',
  sidebar: '加权合成器', sidebarEn: 'Weighted Mixer',
  inputs: [{ id: 'in1', label: '输入1', labelEn: 'Input 1' }, { id: 'in2', label: '输入2', labelEn: 'Input 2' }],
  outputs: [{ id: 'out', label: '合成输出', labelEn: 'Mix Output' }],
  params: [
    { id: 'count', label: '输入数量', labelEn: 'Input Count', type: 'number', default: 2, affectsPorts: true },
    { id: 'weights', label: '输入权重', labelEn: 'Input Weights', type: 'inputWeights', default: {} },
    { id: '_info', label: '', type: 'info', default: '多路信号按各自权重逐点加权求和：out[i]=Σ(in_k[i]×w_k)。\n未设置的权重默认为 1。可用于混合多路信号或实现软切换。', defaultEn: 'Weighted sum of multiple signals: out[i]=Σ(in_k[i]×w_k).\nUnset weights default to 1. Useful for mixing signals or soft switching.' }
  ]
};

export function process(getInput, params, ctx) {
  const count = Math.max(1, Math.min(12, Math.floor(params.count || 2)));
  const weights = params.weights || {};
  const inputs = [];
  for (let i = 1; i <= count; i++) inputs.push(getInput('in' + i));
  const len = inputs.reduce((max, data) => Math.max(max, data.length), 0);
  const out = [];
  for (let i = 0; i < len; i++) {
    let sum = 0;
    inputs.forEach((data, index) => {
      const w = weights['in' + (index + 1)];
      const weight = w !== undefined && Number.isFinite(Number(w)) ? Number(w) : 1;
      sum += (data[i] !== undefined ? data[i] : 0) * weight;
    });
    out.push(sum);
  }
  return { out };
}
