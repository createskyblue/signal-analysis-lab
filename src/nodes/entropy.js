// Causal Window Entropy Node
export const def = {
  type: 'entropy',
  title: '因果窗口信息熵', titleEn: 'Causal Window Entropy',
  category: '窗口统计', categoryEn: 'Window Statistics',
  color: '#f4d03f',
  sidebar: '因果窗口熵', sidebarEn: 'Causal Window Entropy',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'window', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 32 },
    { id: 'bins', label: '分桶数量', labelEn: 'Bin Count', type: 'number', default: 16 },
    { id: '_info', label: '', type: 'info', default: '在因果窗口内将信号幅值等距分桶，计算 Shannon 信息熵（单位 bit）。\n<strong>熵高</strong>→幅值分布均匀（噪声/复杂信号）；<strong>熵低</strong>→幅值集中在少数区间（规律信号如正弦波）。\n<strong>分桶</strong>越多分辨力越强但噪声敏感度也越高。', defaultEn: 'Divides the signal amplitude into equal-width bins within a causal window, then computes Shannon entropy (in bits).\n<strong>High entropy</strong> → uniform amplitude distribution (noise/complex signals); <strong>Low entropy</strong> → amplitude concentrated in few bins (regular signals like sine waves).\n<strong>More bins</strong> → higher resolution but more noise-sensitive.' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  if (!inp.length) return { out: [] };
  const binCount = Math.max(1, Math.floor(params.bins || 1));
  const size = Math.max(1, Math.floor(params.window || 1));
  return {
    out: inp.map((_, i) => {
      const start = Math.max(0, i - size + 1);
      let min = Infinity, max = -Infinity;
      for (let j = start; j <= i; j++) {
        const v = inp[j]; if (v < min) min = v; if (v > max) max = v;
      }
      if (min === max) return 0;
      const hist = new Array(binCount).fill(0);
      const range = max - min;
      for (let j = start; j <= i; j++) {
        const idx = Math.min(binCount - 1, Math.floor((inp[j] - min) / range * binCount));
        hist[idx]++;
      }
      const len = i - start + 1;
      let entropy = 0;
      for (const count of hist) { if (count) { const p = count / len; entropy -= p * Math.log2(p); } }
      return entropy;
    })
  };
}
