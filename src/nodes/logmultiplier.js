// Log Multiplier Node: out = x·log(1+|x|)/log(1+max)
export const def = {
  type: 'logmultiplier',
  title: '对数乘法器', titleEn: 'Log Multiplier',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#2980b9',
  sidebar: '对数乘法器', sidebarEn: 'Log Multiplier',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: '_info', label: '', type: 'info', default: 'out = x·log(1+|x|)/log(1+max)', defaultEn: 'out = x·log(1+|x|)/log(1+max)' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  if (!inp.length) return { out: [] };
  let maxAbs = 0;
  for (const v of inp) { const a = Math.abs(v); if (a > maxAbs) maxAbs = a; }
  if (maxAbs === 0) return { out: [...inp] };
  const logMax = Math.log1p(maxAbs);
  return { out: inp.map(v => Math.sign(v) * Math.abs(v) * Math.log1p(Math.abs(v)) / logMax) };
}
