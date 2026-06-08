// Square Wave Detector Node
const mean = values => values.reduce((sum, v) => sum + v, 0) / values.length;
const stddev = values => {
  const avg = mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length);
};

export const def = {
  type: 'squarewave',
  title: '矩形波检测器', titleEn: 'Square Wave Detector',
  category: '特征提取', categoryEn: 'Feature Extraction',
  color: '#f39c12',
  sidebar: '矩形波检测器', sidebarEn: 'Square Wave Detector',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [
    { id: 'score', label: '规律度', labelEn: 'Regularity' },
    { id: 'period', label: '周期', labelEn: 'Period' },
    { id: 'duty', label: '占空比', labelEn: 'Duty' },
    { id: 'jitter', label: '抖动', labelEn: 'Jitter' }
  ],
  params: [
    { id: 'window', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 128 },
    { id: 'thresholdMode', label: '阈值模式', labelEn: 'Threshold Mode', type: 'select', options: ['自动', '手动'], optionsEn: ['Auto', 'Manual'], default: '自动' },
    { id: 'threshold', label: '手动阈值', labelEn: 'Manual Threshold', type: 'number', default: 0, enabledWhen: { param: 'thresholdMode', value: '手动' } },
    { id: 'minEdges', label: '最少边沿数', labelEn: 'Min Edges', type: 'number', default: 4 },
    { id: '_info', label: '', type: 'info', default: '在因果窗口内检测阈值穿越边沿，提取完整周期（上升沿→下降沿→下一上升沿），计算周期/占空比/抖动，输出 0~1 规律度评分。\n<strong>规律度</strong>越接近 1 表示信号越像稳定矩形波。<strong>窗口</strong>至少包含 2 个完整周期才能有效检测。', defaultEn: 'Detects threshold-crossing edges within a causal window, extracts complete cycles (rising→falling→next rising), computes period/duty/jitter, and outputs a 0~1 regularity score.\n<strong>Regularity</strong> closer to 1 means the signal is more like a stable square wave. <strong>Window</strong> must contain at least 2 complete cycles for effective detection.' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const score = [], period = [], duty = [], jitterOut = [];
  const size = Math.max(2, Math.floor(params.window || 2));
  const requiredEdges = Math.max(2, Math.floor(params.minEdges || 2));
  if (!inp.length) return { score: [], period: [], duty: [], jitter: [] };

  for (let i = 0; i < inp.length; i++) {
    const start = Math.max(0, i - size + 1);
    let min = Infinity, max = -Infinity;
    for (let j = start; j <= i; j++) { const v = inp[j]; if (v < min) min = v; if (v > max) max = v; }
    const threshold = params.thresholdMode === '手动' ? (params.threshold !== undefined ? params.threshold : 0) : (min + max) / 2;
    if (min === max) { score.push(0); period.push(0); duty.push(0); jitterOut.push(1); continue; }

    const edges = [];
    let prev = inp[start] >= threshold ? 1 : 0;
    for (let j = start + 1; j <= i; j++) {
      const state = inp[j] >= threshold ? 1 : 0;
      if (state !== prev) edges.push({ index: j, type: state === 1 ? 'rise' : 'fall' });
      prev = state;
    }
    if (edges.length < requiredEdges) { score.push(0); period.push(0); duty.push(0); jitterOut.push(1); continue; }

    const cycles = [];
    for (let e = 0; e < edges.length; e++) {
      if (edges[e].type !== 'rise') continue;
      const nextRise = edges.slice(e + 1).find(edge => edge.type === 'rise');
      if (!nextRise) continue;
      const fall = edges.slice(e + 1).find(edge => edge.type === 'fall' && edge.index < nextRise.index);
      if (!fall) continue;
      const p = nextRise.index - edges[e].index;
      if (p > 0) cycles.push({ period: p, duty: (fall.index - edges[e].index) / p });
    }
    if (cycles.length < 2) { score.push(0); period.push(0); duty.push(0); jitterOut.push(1); continue; }

    const periods = cycles.map(c => c.period), duties = cycles.map(c => c.duty);
    const periodMean = mean(periods), dutyMean = mean(duties);
    const periodStd = stddev(periods), dutyStd = stddev(duties);
    const jitter = periodMean === 0 ? 1 : periodStd / periodMean;
    score.push(Math.max(0, Math.min(1, (1 / (1 + jitter * 5)) * (1 / (1 + dutyStd * 10)))));
    period.push(periodMean); duty.push(dutyMean); jitterOut.push(jitter);
  }
  return { score, period, duty, jitter: jitterOut };
}
