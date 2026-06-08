// Inverter Node (signal × -1)
export const def = {
  type: 'inverter',
  title: '反相器', titleEn: 'Inverter',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#af7ac5',
  sidebar: '反相器', sidebarEn: 'Inverter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: []
};

export function process(getInput, params, ctx) {
  return { out: getInput('in').map(v => -v) };
}
