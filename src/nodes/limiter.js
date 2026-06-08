// Limiter Node: clamps to [min, max]
export const def = {
  type: 'limiter',
  title: '限位器', titleEn: 'Limiter',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#c0392b',
  sidebar: '限位器', sidebarEn: 'Limiter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'min', label: '最小值', labelEn: 'Min', type: 'number', default: -1 },
    { id: 'max', label: '最大值', labelEn: 'Max', type: 'number', default: 1 }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const lo = params.min !== undefined ? params.min : -1;
  const hi = params.max !== undefined ? params.max : 1;
  return { out: inp.map(v => Math.max(lo, Math.min(hi, v))) };
}
