// Switch Node: passes through when on, blocks when off
export const def = {
  type: 'switch',
  title: '开关', titleEn: 'Switch',
  category: '流程控制', categoryEn: 'Flow Control',
  color: '#f1c40f',
  sidebar: '开关', sidebarEn: 'Switch',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'count', label: '端口数量', labelEn: 'Port Count', type: 'number', default: 1, affectsPorts: true },
    { id: 'enabled', label: '允许通过', labelEn: 'Allow Pass-through', type: 'checkbox', default: true }
  ]
};

export function process(getInput, params, ctx) {
  const count = Math.max(1, Math.min(12, Math.floor(params.count || 1)));
  const outputs = {};
  for (let i = 1; i <= count; i++) {
    const inPort = count === 1 ? 'in' : 'in' + i;
    const outPort = count === 1 ? 'out' : 'out' + i;
    outputs[outPort] = params.enabled === false ? [] : [...getInput(inPort)];
  }
  return outputs;
}
