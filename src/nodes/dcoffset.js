// DC Offset Remover Node: y[i] = x[i] - mean(x)
export const def = {
  type: 'dcoffset',
  title: '去直流偏置', titleEn: 'DC Offset Remover',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#e06c75',
  sidebar: '去直流偏置', sidebarEn: 'DC Offset Remover',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: '_info', label: '', type: 'info', default: 'y[i] = x[i] - mean(x)。消除信号直流分量，使波形围绕零点振荡。', defaultEn: 'y[i] = x[i] - mean(x). Removes the DC component so the waveform oscillates around zero.' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  if (!inp.length) return { out: [] };
  const mean = inp.reduce((sum, v) => sum + v, 0) / inp.length;
  return { out: inp.map(v => v - mean) };
}
