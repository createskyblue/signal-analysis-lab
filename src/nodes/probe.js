// Oscilloscope / Probe Node
export const def = {
  type: 'probe',
  title: '示波器', titleEn: 'Oscilloscope',
  category: '输入和输出', categoryEn: 'Input & Output',
  color: '#e74c3c',
  sidebar: '示波器', sidebarEn: 'Oscilloscope',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'name', label: '示波器名称', labelEn: 'Oscilloscope Name', type: 'text', default: '' },
    { id: 'color', label: '颜色', labelEn: 'Color', type: 'color', default: '' },
    { id: 'enabled', label: '启用', labelEn: 'Enabled', type: 'checkbox', default: true }
  ]
};

export function process(getInput, params, ctx) {
  return { out: [...getInput('in')] };
}
