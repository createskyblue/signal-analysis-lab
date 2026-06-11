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
    { id: 'waveform', label: '波形类型', labelEn: 'Waveform', type: 'select', options: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波', '噪声'], optionsEn: ['Sine', 'Square', 'Triangle', 'Sawtooth', 'Pulse', 'Noise'], default: '正弦波' },
    { id: 'samplerate', label: '采样率 (Hz)', labelEn: 'Sample Rate (Hz)', type: 'number', default: 1000 },
    { id: 'lengthMode', label: '输出长度设置', labelEn: 'Output Length Mode', type: 'select', options: ['点数', '时长'], optionsEn: ['Samples', 'Duration'], default: '点数' },
    { id: 'length', label: '输出点数', labelEn: 'Output Samples', type: 'number', default: 1000, enabledWhen: { param: 'lengthMode', value: '点数' } },
    { id: 'duration', label: '维持时间 (s)', labelEn: 'Duration (s)', type: 'number', default: 1, enabledWhen: { param: 'lengthMode', value: '时长' } },
    { id: 'rateMode', label: '频率设置', labelEn: 'Rate Mode', type: 'select', options: ['频率', '周期'], optionsEn: ['Frequency', 'Period'], default: '频率', enabledWhen: { param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] } },
    { id: 'frequency', label: '频率 (Hz)', labelEn: 'Frequency (Hz)', type: 'number', default: 10, enabledWhen: { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'rateMode', value: '频率' }] } },
    { id: 'period', label: '周期 (s)', labelEn: 'Period (s)', type: 'number', default: 0.1, enabledWhen: { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'rateMode', value: '周期' }] } },
    { id: 'phaseMode', label: '相位设置', labelEn: 'Phase Mode', type: 'select', options: ['相位', '延时'], optionsEn: ['Phase', 'Delay'], default: '相位', enabledWhen: { param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] } },
    { id: 'phase', label: '相位 (°)', labelEn: 'Phase (°)', type: 'number', default: 0, enabledWhen: { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'phaseMode', value: '相位' }] } },
    { id: 'delay', label: '延时 (s)', labelEn: 'Delay (s)', type: 'number', default: 0, enabledWhen: { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'phaseMode', value: '延时' }] } },
    { id: 'levelMode', label: '幅值设置', labelEn: 'Level Mode', type: 'select', options: ['低高电平', '偏移幅值'], optionsEn: ['Low/High', 'Offset/Amplitude'], default: '低高电平', enabledWhen: { param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] } },
    { id: 'high', label: '高电平', labelEn: 'High Level', type: 'number', default: 1, enabledWhen: { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'levelMode', value: '低高电平' }] } },
    { id: 'low', label: '低电平', labelEn: 'Low Level', type: 'number', default: -1, enabledWhen: { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'levelMode', value: '低高电平' }] } },
    { id: 'offset', label: '偏移量', labelEn: 'Offset', type: 'number', default: 0, enabledWhen: { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'levelMode', value: '偏移幅值' }] } },
    { id: 'amplitude', label: '幅值', labelEn: 'Amplitude', type: 'number', default: 1, enabledWhen: { all: [{ param: 'waveform', values: ['正弦波', '矩形波', '三角波', '锯齿波', '脉冲波'] }, { param: 'levelMode', value: '偏移幅值' }] } },
    { id: 'duty', label: '占空比 (%)', labelEn: 'Duty (%)', type: 'number', default: 50, enabledWhen: { param: 'waveform', values: ['矩形波', '脉冲波'] } },
    { id: 'symmetry', label: '对称性 (%)', labelEn: 'Symmetry (%)', type: 'number', default: 50, enabledWhen: { param: 'waveform', value: '三角波' } },
    { id: 'pulseWidthMode', label: '脉宽设置', labelEn: 'Pulse Width Mode', type: 'select', options: ['占空比', '脉宽'], optionsEn: ['Duty', 'Width'], default: '占空比', enabledWhen: { param: 'waveform', value: '脉冲波' } },
    { id: 'pulseWidth', label: '脉宽 (s)', labelEn: 'Pulse Width (s)', type: 'number', default: 0.05, enabledWhen: { all: [{ param: 'waveform', value: '脉冲波' }, { param: 'pulseWidthMode', value: '脉宽' }] } },
    { id: 'riseTime', label: '上升沿时间 (s)', labelEn: 'Rise Time (s)', type: 'number', default: 0, enabledWhen: { param: 'waveform', value: '脉冲波' } },
    { id: 'fallTime', label: '下降沿时间 (s)', labelEn: 'Fall Time (s)', type: 'number', default: 0, enabledWhen: { param: 'waveform', value: '脉冲波' } },
    { id: 'noiseMean', label: '噪声均值', labelEn: 'Noise Mean', type: 'number', default: 0, enabledWhen: { param: 'waveform', value: '噪声' } },
    { id: 'noiseStd', label: '噪声标准差', labelEn: 'Noise Std Dev', type: 'number', default: 0, enabledWhen: { param: 'waveform', value: '噪声' } },
    { id: 'noiseSeed', label: '噪声种子', labelEn: 'Noise Seed', type: 'number', default: 1, enabledWhen: { param: 'waveform', value: '噪声' } },
    { id: '_info', label: '', type: 'info', default: '生成正弦波、矩形波、三角波、锯齿波、脉冲波或噪声。接入长度参考时输出长度自动跟随参考信号。', defaultEn: 'Generates sine, square, triangle, sawtooth, pulse, or noise. Output length auto-follows the reference signal when connected.' }
  ]
};

function cyclePhase(value) {
  return ((value % 1) + 1) % 1;
}

function triangleValue(phase, symmetry = 50) {
  const p = cyclePhase(phase);
  const half = p < 0.5 ? p * 2 : (p - 0.5) * 2;
  const sign = p < 0.5 ? 1 : -1;
  const peak = Math.max(0.001, Math.min(99.999, symmetry)) / 100;
  const shaped = half < peak
    ? half / peak
    : 1 - (half - peak) / (1 - peak);
  return sign * shaped;
}

function pulseValue(phase, frequency, params) {
  const p = cyclePhase(phase);
  const period = frequency > 0 ? 1 / frequency : Infinity;
  const dutyWidth = Math.max(0, Math.min(1, (params.duty !== undefined ? Number(params.duty) : 50) / 100));
  const timeWidth = period === Infinity ? 0 : Math.max(0, Number(params.pulseWidth) || 0) / period;
  const width = params.pulseWidthMode === '脉宽' ? Math.min(1, timeWidth) : dutyWidth;
  const rise = period === Infinity ? 0 : Math.max(0, Number(params.riseTime) || 0) / period;
  const fall = period === Infinity ? 0 : Math.max(0, Number(params.fallTime) || 0) / period;
  const clampedRise = Math.min(rise, width);
  const clampedFall = Math.min(fall, Math.max(0, 1 - width));
  if (p < clampedRise && clampedRise > 0) return -1 + 2 * p / clampedRise;
  if (p < width) return 1;
  if (p < width + clampedFall && clampedFall > 0) return 1 - 2 * (p - width) / clampedFall;
  return -1;
}

function waveValue(waveform, phase, frequency, params) {
  const p = cyclePhase(phase);
  if (waveform === '矩形波') return p < Math.max(0, Math.min(100, params.duty !== undefined ? Number(params.duty) : 50)) / 100 ? 1 : -1;
  if (waveform === '三角波') return triangleValue(phase, params.symmetry !== undefined ? Number(params.symmetry) : 50);
  if (waveform === '锯齿波') return 2 * p - 1;
  if (waveform === '脉冲波') return pulseValue(phase, frequency, params);
  return Math.sin(2 * Math.PI * phase);
}

function createRandom(seed) {
  let state = Math.floor(Math.abs(seed || 1)) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function gaussian(random) {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function process(getInput, params, ctx) {
  const ref = getInput('len');
  const paramSampleRate = Number(params.samplerate);
  const ctxSampleRate = Number(ctx?.sampleRate);
  const sampleRate = paramSampleRate > 0 ? paramSampleRate : (ctxSampleRate > 0 ? ctxSampleRate : 1000);
  const configuredLength = params.lengthMode === '时长'
    ? Math.max(0, Math.round((Number(params.duration) || 0) * sampleRate))
    : Math.max(0, Math.floor(params.length || 0));
  const length = ref.length || configuredLength;
  const count = Math.max(0, Math.floor(length || 0));
  const center = params.levelMode === '偏移幅值'
    ? (params.offset !== undefined ? Number(params.offset) : 0)
    : ((Number(params.high) + Number(params.low)) / 2);
  const amplitude = params.levelMode === '偏移幅值'
    ? (params.amplitude !== undefined ? Number(params.amplitude) : 1)
    : ((Number(params.high) - Number(params.low)) / 2);
  const waveform = params.waveform || '正弦波';
  const frequency = params.rateMode === '周期'
    ? (Number(params.period) > 0 ? 1 / Number(params.period) : 0)
    : (Number(params.frequency) || 0);
  const phaseOffset = params.phaseMode === '延时'
    ? -frequency * (Number(params.delay) || 0)
    : ((Number(params.phase) || 0) / 360);
  const noiseMode = waveform === '噪声';
  const noiseMean = noiseMode ? (Number(params.noiseMean) || 0) : 0;
  const noiseStd = noiseMode ? Math.max(0, Number(params.noiseStd) || 0) : 0;
  const random = createRandom(params.noiseSeed);
  const out = [];
  for (let i = 0; i < count; i++) {
    const phase = frequency * i / sampleRate + phaseOffset;
    const noiseValue = noiseMean + (noiseStd === 0 ? 0 : gaussian(random) * noiseStd);
    out.push(noiseMode ? noiseValue : center + amplitude * waveValue(waveform, phase, frequency, params));
  }
  return { out };
}
