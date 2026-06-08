// Adder Node (A + B)
export const def = {
  type: 'adder',
  title: '加法器', titleEn: 'Adder',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#2ecc71',
  sidebar: '加法器', sidebarEn: 'Adder',
  inputs: [{ id: 'a', label: 'A', labelEn: 'A' }, { id: 'b', label: 'B' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'value', label: 'B值 (B未连接时)', labelEn: 'B Value (when not connected)', type: 'number', default: 0 }
  ]
};

export function process(getInput, params, ctx) {
  const a = getInput('a');
  const b = getInput('b');
  const defaultB = params.value !== undefined ? params.value : 0;
  const len = a.length;
  const out = [];
  for (let i = 0; i < len; i++) out.push((a[i] || 0) + (b.length > 0 && b[i] !== undefined ? b[i] : defaultB));
  return { out };
}
