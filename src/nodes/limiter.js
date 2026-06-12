// Limiter Node: clamps to [min, max] or replaces out-of-range values
export const def = {
  type: 'limiter',
  title: '限位器', titleEn: 'Limiter',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#c0392b',
  sidebar: '限位器', sidebarEn: 'Limiter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'mode', label: '模式', labelEn: 'Mode', type: 'select', default: '限位', options: ['限位', '异常值'], optionsEn: ['Clamp', 'Outlier'] },
    { id: 'max', label: '最大值', labelEn: 'Max', type: 'number', default: 1 },
    { id: 'min', label: '最小值', labelEn: 'Min', type: 'number', default: -1 },
    { id: 'outlierValue', label: '异常值', labelEn: 'Outlier Value', type: 'number', default: 0, enabledWhen: { param: 'mode', value: '异常值' } }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const lo = params.min !== undefined ? params.min : -1;
  const hi = params.max !== undefined ? params.max : 1;
  const mode = params.mode || '限位';
  if (mode === '异常值') {
    const outlierValue = params.outlierValue !== undefined ? params.outlierValue : 0;
    return { out: inp.map(v => (v > hi || v < lo) ? outlierValue : v) };
  }
  return { out: inp.map(v => Math.max(lo, Math.min(hi, v))) };
}
