// Arg Selector Node: point-wise comparison across groups
export const def = {
  type: 'argselector',
  title: '比较选择器', titleEn: 'Arg Selector',
  category: '流程控制', categoryEn: 'Flow Control',
  color: '#e67e22',
  sidebar: '比较选择器', sidebarEn: 'Arg Selector',
  inputs: [
    { id: 'sig1', label: '信号1', labelEn: 'Signal 1' }, { id: 'cmp1', label: '比较1', labelEn: 'Compare 1' },
    { id: 'sig2', label: '信号2', labelEn: 'Signal 2' }, { id: 'cmp2', label: '比较2', labelEn: 'Compare 2' }
  ],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'count', label: '输入组数', labelEn: 'Input Group Count', type: 'number', default: 2, affectsPorts: true },
    { id: 'mode', label: '比较模式', labelEn: 'Compare Mode', type: 'select', options: ['最大值', '最小值'], optionsEn: ['Maximum', 'Minimum'], default: '最大值' },
    { id: 'fallbackEnabled', label: '启用异常值输出', labelEn: 'Enable Fallback Output', type: 'checkbox', default: false },
    { id: 'fallbackMode', label: '异常条件', labelEn: 'Fallback Condition', type: 'select', options: ['大于阈值', '小于阈值'], optionsEn: ['Greater than threshold', 'Less than threshold'], default: '大于阈值' },
    { id: 'fallbackThreshold', label: '阈值', labelEn: 'Threshold', type: 'number', default: 0 },
    { id: 'fallbackValue', label: '异常值', labelEn: 'Fallback Value', type: 'number', default: 0 },
    { id: '_info', label: '', type: 'info', default: '<strong>每组两个输入：</strong>信号（被选择的数据）和比较信号（选择依据）。\n在每个时间点，比较所有组的比较信号，选出最大/最小值所在的那一组，输出该组的信号值。\n<strong>异常值输出（可选）：</strong>当优胜比较值大于/小于设定阈值时，不输出信号值，改为输出用户指定的异常值（如 0）。用于标记比较信号异常的时刻。', defaultEn: '<strong>Each group has two inputs:</strong> Signal (data to select) and Compare (selection basis).\nAt each time point, compares all groups\' compare values, selects the group with the max/min compare value, and outputs that group\'s signal.\n<strong>Fallback output (optional):</strong> When the winning compare value exceeds/falls below the threshold, outputs a user-specified fallback value (e.g. 0) instead of the signal. Useful for flagging abnormal periods.' }
  ]
};

export function process(getInput, params, ctx) {
  const count = Math.max(2, Math.min(8, Math.floor(params.count || 2)));
  const mode = params.mode || '最大值';
  const sigs = [], cmps = [];
  let len = Infinity;
  for (let i = 1; i <= count; i++) {
    const sig = getInput('sig' + i), cmp = getInput('cmp' + i);
    sigs.push(sig); cmps.push(cmp);
    if (cmp.length > 0 && cmp.length < len) len = cmp.length;
  }
  if (len === Infinity || len === 0) return { out: [] };

  const out = [];
  const fallbackOn = params.fallbackEnabled === true;
  const fallbackMode = params.fallbackMode || '大于阈值';
  const fallbackThr = params.fallbackThreshold !== undefined ? Number(params.fallbackThreshold) : 0;
  const fallbackVal = params.fallbackValue !== undefined ? Number(params.fallbackValue) : 0;

  for (let t = 0; t < len; t++) {
    let bestIdx = -1, bestVal = mode === '最大值' ? -Infinity : Infinity;
    for (let i = 0; i < count; i++) {
      if (cmps[i].length === 0) continue;
      const val = cmps[i][t] !== undefined ? cmps[i][t] : (mode === '最大值' ? -Infinity : Infinity);
      if (mode === '最大值' ? val > bestVal : val < bestVal) { bestVal = val; bestIdx = i; }
    }
    if (bestIdx < 0) { out.push(0); continue; }
    const sigVal = sigs[bestIdx][t] !== undefined ? sigs[bestIdx][t] : 0;
    if (fallbackOn) {
      out.push((fallbackMode === '小于阈值' ? bestVal < fallbackThr : bestVal > fallbackThr) ? fallbackVal : sigVal);
    } else { out.push(sigVal); }
  }
  return { out };
}
