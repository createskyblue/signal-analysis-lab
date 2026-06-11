// CSV Input Node
export const def = {
  type: 'input',
  title: 'CSV 输入', titleEn: 'CSV Input',
  category: '输入和输出', categoryEn: 'Input & Output',
  color: '#2e86c1',
  sidebar: 'CSV 输入', sidebarEn: 'CSV Input',
  inputs: [],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'note', label: '备注名', labelEn: 'Note', type: 'text', default: '' },
    { id: 'file', label: '波形数据', labelEn: 'Waveform Data', type: 'file' }
  ]
};

export function process(getInput, params, ctx) {
  return { _isSource: true };
}
