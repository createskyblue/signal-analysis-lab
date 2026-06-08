// Start Node — execution trigger for streaming/async data sources
export const def = {
  type: 'start',
  title: '开始节点', titleEn: 'Start',
  category: '输入和输出', categoryEn: 'Input & Output',
  color: '#27ae60',
  sidebar: '开始节点', sidebarEn: 'Start',
  inputs: [],
  outputs: [{ id: 'out', label: '触发', labelEn: 'Trigger' }],
  params: [
    { id: 'enabled', label: '启用', labelEn: 'Enabled', type: 'checkbox', default: true },
    { id: 'note', label: '备注名', labelEn: 'Note', type: 'text', default: '' },
    { id: 'samplerate', label: '采样率 (Hz)', labelEn: 'Sample Rate (Hz)', type: 'number', default: 500 }
  ]
};

export function process(getInput, params, ctx) {
  if (params.enabled === false) return { _isSource: false, out: [] };
  return { _isSource: true, out: [1] };
}
