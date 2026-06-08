// Multiplexer Node: many-to-one or one-to-many routing
export const def = {
  type: 'multiplexer',
  title: '多路选择器', titleEn: 'Multiplexer',
  category: '流程控制', categoryEn: 'Flow Control',
  color: '#17a2b8',
  sidebar: '多路选择器', sidebarEn: 'Multiplexer',
  inputs: [{ id: 'in1', label: '输入1', labelEn: 'Input 1' }, { id: 'in2', label: '输入2', labelEn: 'Input 2' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'count', label: '端口数量', labelEn: 'Port Count', type: 'number', default: 2, affectsPorts: true },
    { id: 'mode', label: '方向', type: 'select', options: ['多入一出', '一入多出'], optionsEn: ['Many-to-One', 'One-to-Many'], default: '多入一出', affectsPorts: true },
    { id: 'routes', label: '启用通道', type: 'routeChecks', default: {} },
    { id: '_info', label: '', type: 'info', default: '<strong>"多入一出"：</strong>从多路输入中选一路输出。<strong>"一入多出"：</strong>一路输入复制到多路输出（可启用/禁用各通道）。\n用"上一个/下一个"按钮切换选中的通道。只显示已启用的通道。', defaultEn: '<strong>"Many-to-One":</strong> Select one input to output. <strong>"One-to-Many":</strong> Copy one input to multiple outputs (each channel can be enabled/disabled).\nUse Prev/Next buttons to switch the selected channel. Only enabled channels are shown.' }
  ]
};

export function process(getInput, params, ctx) {
  const count = Math.max(1, Math.min(12, Math.floor(params.count || 2)));
  const mode = params.mode === '一入多出' ? '一入多出' : '多入一出';
  const routes = params.routes || {};
  let selectedRoute = 1;
  for (let i = 1; i <= count; i++) { if (routes['ch' + i] === true) { selectedRoute = i; break; } }
  if (mode === '一入多出') {
    const inp = getInput('in');
    const outputs = {};
    for (let i = 1; i <= count; i++) outputs['out' + i] = (selectedRoute === i) ? [...inp] : [];
    return outputs;
  }
  return { out: [...getInput('in' + selectedRoute)] };
}
