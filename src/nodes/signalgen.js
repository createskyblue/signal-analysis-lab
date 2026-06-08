// Signal Generator Node
export const def = {
  type: 'signalgen',
  title: '信号发生器', titleEn: 'Signal Generator',
  category: '输入和输出', categoryEn: 'Input & Output',
  color: '#1abc9c',
  sidebar: '信号发生器', sidebarEn: 'Signal Generator',
  inputs: [{ id: 'len', label: '长度参考', labelEn: 'Length Reference' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'frequency', label: '频率 (Hz)', labelEn: 'Frequency (Hz)', type: 'number', default: 10 },
    { id: 'high', label: '高电平', labelEn: 'High Level', type: 'number', default: 1 },
    { id: 'low', label: '低电平', labelEn: 'Low Level', type: 'number', default: -1 },
    { id: 'length', label: '输出长度', labelEn: 'Output Length', type: 'number', default: 1000 },
    { id: '_info', label: '', type: 'info', default: '生成指定频率和幅值的正弦波。接入长度参考时输出长度自动跟随参考信号。', defaultEn: 'Generates a sine wave with specified frequency and amplitude. Output length auto-follows the reference signal when connected.' }
  ]
};

export function process(getInput, params, ctx) {
  const ref = getInput('len');
  const length = ref.length || Math.max(0, Math.floor(params.length || 0));
  const count = Math.max(0, Math.floor(length || 0));
  const center = (params.high + params.low) / 2;
  const amplitude = (params.high - params.low) / 2;
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(center + amplitude * Math.sin(2 * Math.PI * params.frequency * i / ctx.sampleRate));
  }
  return { out };
}
