// Phase Shifter Node: shifts signal left/right by N samples
export const def = {
  type: 'phaseshifter',
  title: '移相器', titleEn: 'Phase Shifter',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#8e44ad',
  sidebar: '移相器', sidebarEn: 'Phase Shifter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'shift', label: '偏移点数 (负=左移, 正=右移)', labelEn: 'Shift (neg=left, pos=right)', type: 'number', default: 10 }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const shift = Math.floor(params.shift || 0);
  if (shift === 0) return { out: [...inp] };
  if (shift > 0) return { out: [...new Array(shift).fill(0), ...inp.slice(0, inp.length - shift)] };
  const s = -shift;
  return { out: [...inp.slice(s), ...new Array(s).fill(0)] };
}
