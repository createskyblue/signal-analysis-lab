// Variable Node
export const def = {
  type: 'variable',
  title: '变量', titleEn: 'Variable',
  category: '输入和输出', categoryEn: 'Input & Output',
  color: '#8e44ad',
  sidebar: '变量', sidebarEn: 'Variable',
  inputs: [{ id: 'len', label: '长度参考', labelEn: 'Length Reference' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'variableName', label: '变量名', labelEn: 'Variable Name', type: 'text', default: 'var1' },
    { id: 'value', label: '数值', labelEn: 'Value', type: 'number', default: 0 }
  ]
};

export function process(getInput, params, ctx) {
  const value = Number(params.value);
  const resolvedValue = Number.isFinite(value) ? value : 0;
  const ref = getInput('len');
  const count = Math.max(1, Math.floor(ref.length || 1));
  return { out: new Array(count).fill(resolvedValue) };
}
