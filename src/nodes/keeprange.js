// Keep Range Node: keeps only data within a specified range
export const def = {
  type: 'keeprange',
  title: 'Keep Range',
  category: '裁剪截取', categoryEn: 'Trim & Cut',
  color: '#27ae60',
  sidebar: 'Keep Range',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'start', label: '起始 (%)', labelEn: 'Start (%)', type: 'number', default: 20 },
    { id: 'end', label: '结束 (%)', labelEn: 'End (%)', type: 'number', default: 80 },
    { id: 'mode', label: '模式', labelEn: 'Mode', type: 'select', options: ['裁剪', '置零'], optionsEn: ['Trim', 'Zero'], default: '裁剪' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const startIdx = Math.floor(inp.length * Math.max(0, Math.min(100, params.start || 0)) / 100);
  const endIdx = Math.floor(inp.length * Math.max(0, Math.min(100, params.end || 100)) / 100);
  if ((params.mode || '裁剪') === '裁剪') return { out: inp.slice(startIdx, endIdx) };
  return { out: inp.map((v, i) => (i >= startIdx && i < endIdx) ? v : 0) };
}
