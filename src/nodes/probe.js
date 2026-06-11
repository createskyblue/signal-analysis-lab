// Oscilloscope / Probe Node
export const def = {
  type: 'probe',
  title: '示波器', titleEn: 'Oscilloscope',
  category: '输入和输出', categoryEn: 'Input & Output',
  color: '#e74c3c',
  sidebar: '示波器', sidebarEn: 'Oscilloscope',
  inputs: [{ id: 'in', label: 'Y输入', labelEn: 'Y Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'name', label: '示波器名称', labelEn: 'Oscilloscope Name', type: 'text', default: '' },
    { id: 'displayMode', label: '显示模式', labelEn: 'Display Mode', type: 'select', options: ['Y-T', 'X-Y'], optionsEn: ['Y-T', 'X-Y'], default: 'Y-T', affectsPorts: true },
    { id: 'color', label: '颜色', labelEn: 'Color', type: 'color', default: '' },
    { id: 'enabled', label: '启用', labelEn: 'Enabled', type: 'checkbox', default: true }
  ]
};

export function process(getInput, params, ctx) {
  return { out: [...getInput('in')] };
}
