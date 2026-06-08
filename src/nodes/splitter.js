// Splitter Node: copies 1 signal to N outputs
export const def = {
  type: 'splitter',
  title: '分流器', titleEn: 'Splitter',
  category: '流程控制', categoryEn: 'Flow Control',
  color: '#f39c12',
  sidebar: '分流器', sidebarEn: 'Splitter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out1', label: '输出1', labelEn: 'Output 1' }, { id: 'out2', label: '输出2', labelEn: 'Output 2' }],
  params: [
    { id: 'count', label: '输出数量', labelEn: 'Output Count', type: 'number', default: 2, affectsPorts: true },
    { id: '_info', label: '', type: 'info', default: '一路信号复制为 N 路完全相同的输出，输出数量可配置。用于将同一信号同时送入多个下游节点。', defaultEn: 'Copies one signal to N identical outputs. Output count is configurable. Used to feed the same signal to multiple downstream nodes simultaneously.' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const count = Math.max(1, Math.min(12, Math.floor(params.count || 2)));
  const outputs = {};
  for (let i = 1; i <= count; i++) outputs['out' + i] = [...inp];
  return outputs;
}
