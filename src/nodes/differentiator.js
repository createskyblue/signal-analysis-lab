// Differentiator Node: y[i] = x[i] - x[i-1]
export const def = {
  type: 'differentiator',
  title: '微分器', titleEn: 'Differentiator',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#56b6c2',
  sidebar: '微分器', sidebarEn: 'Differentiator',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: '_info', label: '', type: 'info', default: 'y[i] = x[i] - x[i-1]。计算信号逐点变化率（一阶差分）。', defaultEn: 'y[i] = x[i] - x[i-1]. Computes the per-sample rate of change (first-order difference).' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  if (!inp.length) return { out: [] };
  const out = [0];
  for (let i = 1; i < inp.length; i++) out.push(inp[i] - inp[i - 1]);
  return { out };
}
