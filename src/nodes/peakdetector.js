// Peak/Valley Detector Node
export const def = {
  type: 'peakdetector',
  title: '峰谷检测器', titleEn: 'Peak/Valley Detector',
  category: '特征提取', categoryEn: 'Feature Extraction',
  color: '#e5c07b',
  sidebar: '峰谷检测器', sidebarEn: 'Peak/Valley Detector',
  inputs: [{ id: 'in', label: '信号', labelEn: 'Signal' }, { id: 'in2', label: '触发', labelEn: 'Trigger' }],
  outputs: [
    { id: 'out', label: '峰值脉冲', labelEn: 'Peak Pulse' }, { id: 'out2', label: '谷值脉冲', labelEn: 'Valley Pulse' },
    { id: 'out3', label: '峰峰间隔', labelEn: 'Peak-to-Peak' }, { id: 'out4', label: '谷谷间隔', labelEn: 'Valley-to-Valley' },
    { id: 'out5', label: '峰峰间隔(紧凑)', labelEn: 'Peak-Peak (Compact)' }, { id: 'out6', label: '谷谷间隔(紧凑)', labelEn: 'Valley-Valley (Compact)' },
    { id: 'out7', label: '触发峰间隔', labelEn: 'Trig Peak Interval' }, { id: 'out8', label: '触发峰间隔(紧凑)', labelEn: 'Trig Peak Intvl (Compact)' },
    { id: 'out9', label: '触发谷间隔', labelEn: 'Trig Valley Interval' }, { id: 'out10', label: '触发谷间隔(紧凑)', labelEn: 'Trig Valley Intvl (Compact)' }
  ],
  params: [
    { id: 'showBandIntervalSH', label: '峰谷间隔 S&H 输出', labelEn: 'Peak/Valley S&H Output', type: 'checkbox', default: true, affectsPorts: true },
    { id: 'showBandIntervalCompact', label: '峰谷间隔 紧凑 输出', labelEn: 'Peak/Valley Compact Output', type: 'checkbox', default: true, affectsPorts: true },
    { id: 'showTrigInterval', label: '触发间隔输出 (out7~10)', labelEn: 'Trig Interval Output (out7~10)', type: 'checkbox', default: false, affectsPorts: true },
    { id: '_info', label: '', type: 'info', default: '<strong>信号(in)：</strong>待分析的连续波形，通常是带通滤波后的信号。\n<strong>触发(in2)：</strong>0/1 方波，通常来自迟滞比较器。每次跳变(0→1 或 1→0)标记一个分段边界，在此分段内找到信号的最大/最小值作为峰/谷。\n<strong>典型接法：</strong>带通滤波 → 迟滞比较器 → 本节点(in2)，同时带通输出也接到本节点(in)。', defaultEn: '<strong>Signal (in):</strong> The continuous waveform to analyze, typically a bandpass-filtered signal.\n<strong>Trigger (in2):</strong> 0/1 square wave, typically from a hysteresis comparator. Each edge (0→1 or 1→0) marks a segment boundary; within that segment, the signal\'s max/min is found as the peak/valley.\n<strong>Typical wiring:</strong> Bandpass → Hysteresis Comparator → this node (in2), and also Bandpass output → this node (in).' }
  ]
};

export function process(getInput, params, ctx) {
  const signal = getInput('in'), trigger = getInput('in2');
  const n = signal.length;
  const outNames = ['out','out2','out3','out4','out5','out6','out7','out8','out9','out10'];
  if (!n) return Object.fromEntries(outNames.map(k => [k, []]));

  const trig = trigger || [];
  const peakPulse = new Array(n).fill(0), valleyPulse = new Array(n).fill(0);
  const peakToPeak = new Array(n).fill(0), valleyToValley = new Array(n).fill(0);
  const trigPeakInterval = new Array(n).fill(0), trigValInterval = new Array(n).fill(0);
  const detectedPeakToPeak = [], detectedValleyToValley = [];
  const detectedTrigPeaks = [], detectedTrigVals = [];
  const EPS = 1e-12;

  let prevTrig = Number.isFinite(Number(trig[0])) ? Number(trig[0]) : 0;
  let segment = null;
  let lastPeakIdx = -1, lastValleyIdx = -1, lastRiseIdx = -1, lastFallIdx = -1;

  for (let i = 1; i < n; i++) {
    const rawTrig = Number(trig[i]), curTrig = Number.isFinite(rawTrig) ? rawTrig : prevTrig;
    if (Math.abs(curTrig - prevTrig) > EPS) {
      const isRising = curTrig > prevTrig;
      if (segment) {
        const idx = segment.index;
        if (segment.type === 'peak') {
          peakPulse[idx] = 1;
          if (lastPeakIdx >= 0) { const interval = idx - lastPeakIdx; peakToPeak[idx] = interval; detectedPeakToPeak.push(interval); }
          lastPeakIdx = idx;
        } else {
          valleyPulse[idx] = -1;
          if (lastValleyIdx >= 0) { const interval = idx - lastValleyIdx; valleyToValley[idx] = interval; detectedValleyToValley.push(interval); }
          lastValleyIdx = idx;
        }
      }
      if (isRising) {
        if (lastRiseIdx >= 0) { const interval = i - lastRiseIdx; trigPeakInterval[i] = interval; detectedTrigPeaks.push(interval); }
        lastRiseIdx = i;
      } else {
        if (lastFallIdx >= 0) { const interval = i - lastFallIdx; trigValInterval[i] = interval; detectedTrigVals.push(interval); }
        lastFallIdx = i;
      }
      segment = { type: isRising ? 'peak' : 'valley', index: i, value: Number.isFinite(Number(signal[i])) ? Number(signal[i]) : 0 };
      prevTrig = curTrig;
    } else if (segment) {
      const bandVal = Number.isFinite(Number(signal[i])) ? Number(signal[i]) : 0;
      if ((segment.type === 'peak' && bandVal > segment.value) || (segment.type === 'valley' && bandVal < segment.value)) {
        segment.index = i; segment.value = bandVal;
      }
    }
  }
  if (segment) {
    const idx = segment.index;
    if (segment.type === 'peak') {
      peakPulse[idx] = 1;
      if (lastPeakIdx >= 0) { const interval = idx - lastPeakIdx; peakToPeak[idx] = interval; detectedPeakToPeak.push(interval); }
    } else {
      valleyPulse[idx] = -1;
      if (lastValleyIdx >= 0) { const interval = idx - lastValleyIdx; valleyToValley[idx] = interval; detectedValleyToValley.push(interval); }
    }
  }

  let hp = 0, hv = 0, htp = 0, htv = 0;
  for (let i = 0; i < n; i++) {
    if (peakToPeak[i] !== 0) hp = peakToPeak[i]; else peakToPeak[i] = hp;
    if (valleyToValley[i] !== 0) hv = valleyToValley[i]; else valleyToValley[i] = hv;
    if (trigPeakInterval[i] !== 0) htp = trigPeakInterval[i]; else trigPeakInterval[i] = htp;
    if (trigValInterval[i] !== 0) htv = trigValInterval[i]; else trigValInterval[i] = htv;
  }

  return { out: peakPulse, out2: valleyPulse, out3: peakToPeak, out4: valleyToValley,
    out5: detectedPeakToPeak, out6: detectedValleyToValley,
    out7: trigPeakInterval, out8: detectedTrigPeaks,
    out9: trigValInterval, out10: detectedTrigVals };
}
