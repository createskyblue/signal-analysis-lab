// CSV Output Node
export const def = {
  type: 'csvoutput',
  title: 'CSV 输出', titleEn: 'CSV Output',
  category: '输入和输出', categoryEn: 'Input & Output',
  color: '#148f77',
  sidebar: 'CSV 输出', sidebarEn: 'CSV Output',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [],
  params: [
    { id: 'name', label: '文件名', labelEn: 'Filename', type: 'text', default: 'signal_output' },
    { id: 'autoExport', label: '允许自动导出', labelEn: 'Allow Auto Export', type: 'checkbox', default: false },
    { id: 'info', label: '说明', labelEn: 'Info', type: 'info', default: '可手动导出；自动导出需同时打开右上角开关' }
  ]
};

export function process(getInput, params, ctx) {
  return {};
}
