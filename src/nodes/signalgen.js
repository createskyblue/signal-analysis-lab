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
    { id: 'waveform', label: '波形类型', labelEn: 'Waveform', type: 'select', options: ['正弦波', '矩形波', '三角波', '锯齿波'], optionsEn: ['Sine', 'Square', 'Triangle', 'Sawtooth'], default: '正弦波' },
    { id: 'frequency', label: '频率 (Hz)', labelEn: 'Frequency (Hz)', type: 'number', default: 10 },
    { id: 'phase', label: '相位 (°)', labelEn: 'Phase (°)', type: 'number', default: 0 },
    { id: 'high', label: '高电平', labelEn: 'High Level', type: 'number', default: 1 },
    { id: 'low', label: '低电平', labelEn: 'Low Level', type: 'number', default: -1 },
    { id: 'length', label: '输出长度', labelEn: 'Output Length', type: 'number', default: 1000 },
    { id: '_info', label: '', type: 'info', default: '生成指定频率、相位和幅值的正弦波、矩形波、三角波或锯齿波。接入长度参考时输出长度自动跟随参考信号。', defaultEn: 'Generates sine, square, triangle, or sawtooth waves with specified frequency, phase, and amplitude. Output length auto-follows the reference signal when connected.' }
  ]
};

function cyclePhase(value) {
  return ((value % 1) + 1) % 1;
}

function waveValue(waveform, phase) {
  const p = cyclePhase(phase);
  if (waveform === '矩形波') return p < 0.5 ? 1 : -1;
  if (waveform === '三角波') return 1 - 4 * Math.abs(p - 0.25 + (p >= 0.75 ? -1 : 0));
  if (waveform === '锯齿波') return 2 * p - 1;
  return Math.sin(2 * Math.PI * phase);
}

export function process(getInput, params, ctx) {
  const ref = getInput('len');
  const length = ref.length || Math.max(0, Math.floor(params.length || 0));
  const count = Math.max(0, Math.floor(length || 0));
  const center = (params.high + params.low) / 2;
  const amplitude = (params.high - params.low) / 2;
  const waveform = params.waveform || '正弦波';
  const frequency = params.frequency || 0;
  const phaseOffset = (params.phase || 0) / 360;
  const out = [];
  for (let i = 0; i < count; i++) {
    const phase = frequency * i / ctx.sampleRate + phaseOffset;
    out.push(center + amplitude * waveValue(waveform, phase));
  }
  return { out };
}
