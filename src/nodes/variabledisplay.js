// Variable Display Node
export const def = {
  type: 'variabledisplay',
  title: '变量显示', titleEn: 'Variable Display',
  category: '输入和输出', categoryEn: 'Input & Output',
  color: '#9b59b6',
  sidebar: '变量显示', sidebarEn: 'Variable Display',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'variableName', label: '变量名', labelEn: 'Variable Name', type: 'text', default: '' },
    { id: 'readout', label: '当前值', labelEn: 'Current Value', type: 'variableReadout', default: '未运行' }
  ]
};

export function process(getInput, params, ctx) {
  const input = getInput('in');
  const values = ctx?.variables instanceof Map ? ctx.variables : new Map();
  const key = String(params.variableName || params.name || '').trim();
  let readout;
  if (key) {
    readout = values.has(key) ? String(values.get(key)) : '未定义';
  } else if (values.size) {
    readout = Array.from(values.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => `${name} = ${value}`)
      .join('\n');
  } else {
    readout = '无变量';
  }
  return { out: [...input], readout };
}
