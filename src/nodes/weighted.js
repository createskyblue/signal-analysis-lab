// Exponential Average / EMA / 1st-order IIR Node
export const def = {
  type: 'weighted',
  title: '指数平均滤波器', titleEn: 'Exponential Avg Filter',
  category: '滤波器', categoryEn: 'Filters',
  color: '#7d3c98',
  sidebar: '指数平均滤波', sidebarEn: 'Exponential Avg Filter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'alpha', label: '平滑系数 α (0~1)', labelEn: 'Smoothing α (0~1)', type: 'number', default: 0.1 },
    { id: '_info', label: '', type: 'info', default: 'y[i] = α·x[i] + (1-α)·y[i-1] （EMA / 一阶 IIR）', defaultEn: 'y[i] = α·x[i] + (1-α)·y[i-1] (EMA / 1st-order IIR)' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const alpha = Math.max(0, Math.min(1, params.alpha !== undefined ? params.alpha : 0.1));
  const out = [];
  if (inp.length) {
    out.push(inp[0]);
    for (let i = 1; i < inp.length; i++) out.push(alpha * inp[i] + (1 - alpha) * out[i - 1]);
  }
  return { out };
}
