// Highpass Filter Node (RC)
export const def = {
  type: 'highpass',
  title: '高通滤波器', titleEn: 'Highpass Filter',
  category: '滤波器', categoryEn: 'Filters',
  color: '#bb8fce',
  sidebar: '高通滤波', sidebarEn: 'Highpass Filter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'cutoff', label: '截止频率 (Hz)', labelEn: 'Cutoff Freq (Hz)', type: 'number', default: 50 },
    { id: 'order', label: '阶数 (1~8)', labelEn: 'Order (1~8)', type: 'number', default: 2, min: 1 },
    { id: '_info', label: '', type: 'info', default: '衰减 ＜截止频率 的信号。阶数越高衰减越陡（每阶 6dB/oct）。', defaultEn: 'Attenuates signals below the cutoff frequency. Higher orders give steeper roll-off (6dB/oct per stage).' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const order = Math.max(1, Math.min(8, Math.floor(params.order || 2)));
  if (!inp.length) return { out: [] };
  let result = inp;
  for (let stage = 0; stage < order; stage++) {
    const rc = 1.0 / ((params.cutoff || 50) * 2 * Math.PI);
    const dt = 1.0 / ctx.sampleRate;
    const alpha = rc / (rc + dt);
    const out = [0];
    for (let i = 1; i < result.length; i++) {
      out.push(alpha * (out[i - 1] + result[i] - result[i - 1]));
    }
    result = out;
  }
  return { out: result };
}
