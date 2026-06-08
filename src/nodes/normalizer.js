// Normalizer Node: maps to [-1, 1] range
export const def = {
  type: 'normalizer',
  title: '归一化', titleEn: 'Normalizer',
  category: '运算与变换', categoryEn: 'Operations & Transform',
  color: '#5dade2',
  sidebar: '归一化', sidebarEn: 'Normalizer',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'mode', label: '范围模式', labelEn: 'Range Mode', type: 'select', options: ['全部', '窗口'], optionsEn: ['Global', 'Windowed'], default: '全部' },
    { id: 'window', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 32, enabledWhen: { param: 'mode', value: '窗口' } },
    { id: '_info', label: '', type: 'info', default: '将信号线性映射到 [-1, 1] 范围。"全部"用整个缓冲区做一次 min-max 归一化；"窗口"用滑动窗口逐点归一化，适合幅值随时间变化的信号。', defaultEn: 'Linearly maps the signal to the [-1, 1] range. "Global" uses the entire buffer for a single min-max normalization; "Windowed" normalizes point-by-point with a sliding window, suitable for signals with time-varying amplitude.' }
  ]
};

function normalizeGlobal(input) {
  let min = Infinity, max = -Infinity;
  for (const v of input) { if (v < min) min = v; if (v > max) max = v; }
  const range = max - min;
  return range === 0 ? input.map(() => 0) : input.map(v => 2 * (v - min) / range - 1);
}

function normalizeWindow(input, windowSize) {
  return input.map((v, i) => {
    const start = Math.max(0, i - windowSize + 1);
    let min = Infinity, max = -Infinity;
    for (let j = start; j <= i; j++) {
      if (input[j] < min) min = input[j];
      if (input[j] > max) max = input[j];
    }
    const range = max - min;
    return range === 0 ? 0 : 2 * (v - min) / range - 1;
  });
}

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  if (!inp.length) return { out: [] };
  const mode = params.mode === '窗口' ? '窗口' : '全部';
  const windowSize = Math.max(1, Math.floor(params.window || 1));
  return { out: mode === '窗口' ? normalizeWindow(inp, windowSize) : normalizeGlobal(inp) };
}
