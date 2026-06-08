// Cut Beg Node: trims first N% of data
export const def = {
  type: 'cutbeg',
  title: 'Cut Beg',
  category: '裁剪截取', categoryEn: 'Trim & Cut',
  color: '#e67e22',
  sidebar: 'Cut Beg',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'percent', label: '裁剪比例 (%)', labelEn: 'Cut Ratio (%)', type: 'number', default: 10 },
    { id: 'mode', label: '模式', labelEn: 'Mode', type: 'select', options: ['裁剪', '置零'], optionsEn: ['Trim', 'Zero'], default: '裁剪' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const pct = Math.max(0, Math.min(100, params.percent || 0));
  const count = Math.floor(inp.length * pct / 100);
  if ((params.mode || '裁剪') === '裁剪') return { out: inp.slice(count) };
  return { out: inp.map((v, i) => i < count ? 0 : v) };
}
