// Cut End Node: trims last N% of data
export const def = {
  type: 'cutend',
  title: 'Cut End',
  category: '裁剪截取', categoryEn: 'Trim & Cut',
  color: '#d35400',
  sidebar: 'Cut End',
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
  if ((params.mode || '裁剪') === '裁剪') return { out: inp.slice(0, inp.length - count) };
  const start = inp.length - count;
  return { out: inp.map((v, i) => i >= start ? 0 : v) };
}
