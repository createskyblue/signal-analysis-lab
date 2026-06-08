// Hysteresis Comparator Node: converts continuous signal to 0/1 square wave
export const def = {
  type: 'hysteresis',
  title: '迟滞比较器', titleEn: 'Hysteresis Comparator',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#e74c3c',
  sidebar: '迟滞比较器', sidebarEn: 'Hysteresis Comparator',
  inputs: [{ id: 'a', label: 'A', labelEn: 'A' }, { id: 'b', label: 'B(阈值)', labelEn: 'B(Thresh)' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'threshold', label: '阈值 (B未连接时)', labelEn: 'Threshold (B not connected)', type: 'number', default: 0.5 },
    { id: 'hyst', label: '迟滞 (0=禁用)', labelEn: 'Hysteresis (0=off)', type: 'number', default: 0.1 },
    { id: '_info', label: '', type: 'info', default: '将连续信号转为 0/1 方波。信号 > 阈值+Hyst → 输出 1；信号 < 阈值-Hyst → 输出 0；中间区域保持上一状态。\n<strong>迟滞</strong>越大抗噪越强，但会延迟翻转时刻。<strong>hyst=0</strong> 退化为普通过零比较器。\n<strong>B 端口</strong>未连接时使用参数"阈值"；连接后使用 B 端口的逐点值作为阈值。', defaultEn: 'Converts a continuous signal to a 0/1 square wave. Signal > threshold+Hyst → output 1; Signal < threshold-Hyst → output 0; in between, holds previous state.\n<strong>Larger hysteresis</strong> gives better noise immunity but delays transition timing. <strong>hyst=0</strong> degenerates to a plain zero-crossing comparator.\n<strong>Port B</strong> not connected → uses the "Threshold" parameter; connected → uses port B\'s per-sample value as the threshold.' }
  ]
};

export function process(getInput, params, ctx) {
  const a = getInput('a');
  const b = getInput('b');
  const defaultThresh = params.threshold !== undefined ? params.threshold : 0.5;
  const hyst = Math.max(0, params.hyst !== undefined ? params.hyst : 0.1);
  const out = [];
  let state = 0;
  for (let i = 0; i < a.length; i++) {
    const v = a[i] || 0;
    const t = (b.length > 0 && b[i] !== undefined) ? b[i] : defaultThresh;
    if (hyst === 0) { state = v > t ? 1 : 0; }
    else {
      if (state === 0 && v > t + hyst) state = 1;
      else if (state === 1 && v < t - hyst) state = 0;
    }
    out.push(state);
  }
  return { out };
}
