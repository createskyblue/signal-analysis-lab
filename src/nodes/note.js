// Note Node (text note, no ports)
export const def = {
  type: 'note',
  title: '便签', titleEn: 'Note',
  category: '辅助', categoryEn: 'Utilities',
  color: '#c9a227',
  sidebar: '便签', sidebarEn: 'Note',
  inputs: [], outputs: [],
  params: [
    { id: 'text', label: '内容', labelEn: 'Content', type: 'noteText', default: '写下备注...' }
  ]
};

export function process(getInput, params, ctx) {
  return {};
}
