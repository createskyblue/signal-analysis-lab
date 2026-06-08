// Absolute Value Node
export const def = {
  type: 'abs',
  title: '绝对值', titleEn: 'Absolute Value',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#16a085',
  sidebar: '绝对值', sidebarEn: 'Absolute Value',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: []
};

export function process(getInput, params, ctx) {
  return { out: getInput('in').map(v => Math.abs(v)) };
}
