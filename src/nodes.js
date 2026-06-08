import { DSP } from './dsp.js';

// ============================================================
//  NODE DEFINITIONS
// ============================================================
export const state = { nodeIdCounter: 0 };

const NODE_DEFS = {
  input: {
    type: 'input', title: 'CSV 输入', titleEn: 'CSV Input',
    inputs: [],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'note', label: '备注名', labelEn: 'Note', type: 'text', default: '' },
      { id: 'samplerate', label: '采样率 (Hz)', labelEn: 'Sample Rate (Hz)', type: 'number', default: 1000 },
      { id: 'file', label: '波形数据', labelEn: 'Waveform Data', type: 'file' }
    ]
  },
  signalgen: {
    type: 'signalgen', title: '信号发生器', titleEn: 'Signal Generator',
    inputs: [{ id: 'len', label: '长度参考', labelEn: 'Length Reference' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'frequency', label: '频率 (Hz)', labelEn: 'Frequency (Hz)', type: 'number', default: 10 },
      { id: 'high', label: '高电平', labelEn: 'High Level', type: 'number', default: 1 },
      { id: 'low', label: '低电平', labelEn: 'Low Level', type: 'number', default: -1 },
      { id: 'length', label: '输出长度', labelEn: 'Output Length', type: 'number', default: 1000 },
      { id: '_info', label: '', type: 'info', default: '生成指定频率和幅值的正弦波。接入长度参考时输出长度自动跟随参考信号。', defaultEn: 'Generates a sine wave with specified frequency and amplitude. Output length auto-follows the reference signal when connected.' }
    ]
  },
  lowpass: {
    type: 'lowpass', title: '低通滤波器', titleEn: 'Lowpass Filter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'cutoff', label: '截止频率 (Hz)', labelEn: 'Cutoff Freq (Hz)', type: 'number', default: 50 },
      { id: 'order', label: '阶数 (1~8)', labelEn: 'Order (1~8)', type: 'number', default: 2, min: 1 },
      { id: '_info', label: '', type: 'info', default: '衰减 ＞截止频率 的信号。阶数越高衰减越陡（每阶 6dB/oct）。阶数升高会略降低有效截止频率。', defaultEn: 'Attenuates signals above the cutoff frequency. Higher orders give steeper roll-off (6dB/oct per stage). Higher orders slightly reduce the effective cutoff frequency.' }
    ]
  },
  highpass: {
    type: 'highpass', title: '高通滤波器', titleEn: 'Highpass Filter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'cutoff', label: '截止频率 (Hz)', labelEn: 'Cutoff Freq (Hz)', type: 'number', default: 50 },
      { id: 'order', label: '阶数 (1~8)', labelEn: 'Order (1~8)', type: 'number', default: 2, min: 1 },
      { id: '_info', label: '', type: 'info', default: '衰减 ＜截止频率 的信号。阶数越高衰减越陡（每阶 6dB/oct）。', defaultEn: 'Attenuates signals below the cutoff frequency. Higher orders give steeper roll-off (6dB/oct per stage).' }
    ]
  },
  bandpass: {
    type: 'bandpass', title: '带通滤波器', titleEn: 'Bandpass Filter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'lowcut', label: '低截止 (Hz)', labelEn: 'Low Cut (Hz)', type: 'number', default: 30 },
      { id: 'highcut', label: '高截止 (Hz)', labelEn: 'High Cut (Hz)', type: 'number', default: 100 },
      { id: 'order', label: '阶数 (1~8)', labelEn: 'Order (1~8)', type: 'number', default: 2, min: 1 },
      { id: '_info', label: '', type: 'info', default: '只保留低截止～高截止之间的频率。阶数越高边缘越陡。⚠️ 两截止频率应相差 2~3 倍以上，靠太近信号严重衰减。', defaultEn: 'Keeps only frequencies between low and high cutoffs. Higher orders give steeper edges. ⚠️ Cutoff frequencies should differ by at least 2-3x; if too close, the signal will be severely attenuated.' }
    ]
  },
  weighted: {
    type: 'weighted', title: '指数平均滤波器', titleEn: 'Exponential Avg Filter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'alpha', label: '平滑系数 α (0~1)', labelEn: 'Smoothing α (0~1)', type: 'number', default: 0.1 },
      { id: '_info', label: '', type: 'info', default: 'y[i] = α·x[i] + (1-α)·y[i-1] （EMA / 一阶 IIR）', defaultEn: 'y[i] = α·x[i] + (1-α)·y[i-1] (EMA / 1st-order IIR)' }
    ]
  },
  firlinear: {
    type: 'firlinear', title: 'FIR 线性相位滤波器', titleEn: 'FIR Linear Phase Filter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'cutoff', label: '截止频率 (Hz)', labelEn: 'Cutoff Freq (Hz)', type: 'number', default: 50 },
      { id: 'taps', label: '抽头数量 (奇数)', labelEn: 'Taps (odd)', type: 'number', default: 31 },
      { id: '_info', label: '', type: 'info', default: 'Hamming 窗 sinc 低通 FIR。抽头数越大衰减越陡但计算量也越大。\n<strong>与 RC 滤波器不同：</strong>FIR 是线性相位（各频率延迟一致），适合对波形形状有要求的场景。', defaultEn: 'Hamming-windowed sinc lowpass FIR. More taps = steeper roll-off but higher computation cost.\n<strong>Unlike RC filters:</strong> FIR has linear phase (uniform delay across frequencies), suitable when waveform shape matters.' }
    ]
  },
  madfilter: {
    type: 'madfilter', title: 'Hampel滤波器', titleEn: 'Hampel Filter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [
      { id: 'out', label: '滤波结果', labelEn: 'Filtered' },
      { id: 'mad', label: 'MAD' }
    ],
    params: [
      { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 7 },
      { id: 'threshold', label: '阈值倍数', labelEn: 'Threshold Factor', type: 'number', default: 3 },
      { id: 'scale', label: 'MAD 缩放系数', labelEn: 'MAD Scale', type: 'number', default: 1.4826 },
      { id: '_info', label: '', type: 'info', default: '对每个采样点，取窗口内中位数 med 和中位绝对偏差 MAD。若 |x-med| > 阈值×scale×MAD，则替换为中位数。\n<strong>阈值=0 时</strong>退化为纯中值滤波。scale=1.4826 使 MAD≈标准差（正态假设）。\n<strong>输出</strong> out=滤波结果, mad=局部 MAD 轨迹（用于调参）。', defaultEn: 'For each sample, computes the window median (med) and Median Absolute Deviation (MAD). If |x-med| > threshold×scale×MAD, the sample is replaced by the median.\n<strong>threshold=0</strong> degenerates to pure median filter. scale=1.4826 makes MAD ≈ standard deviation (under normality assumption).\n<strong>Outputs:</strong> out=filtered result, mad=local MAD trace (for parameter tuning).' }
    ]
  },
  fft: {
    type: 'fft', title: 'FFT 频谱', titleEn: 'FFT Spectrum',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '幅值谱', labelEn: 'Magnitude Spectrum' }],
    params: [
      { id: 'size', label: 'FFT 点数', labelEn: 'FFT Points', type: 'number', default: 1024 },
      { id: 'minFreq', label: '最小频率 (Hz)', labelEn: 'Min Freq (Hz)', type: 'number', default: '', optional: true, min: 0 },
      { id: 'maxFreq', label: '最大频率 (Hz)', labelEn: 'Max Freq (Hz)', type: 'number', default: '', optional: true, min: 0 },
      { id: '_info', label: '', type: 'info', default: '计算输入信号的单边幅值谱（FFT 取模）。点数越大频率分辨力越高（Δf=采样率/点数）。\n<strong>频率范围：</strong>最小/最大频率留空时默认显示 0~采样率/2。输出 X 轴单位为 Hz。', defaultEn: 'Computes single-sided magnitude spectrum (FFT magnitude). More points = higher frequency resolution (Δf = sampleRate / points).\n<strong>Frequency range:</strong> When min/max frequency is left empty, defaults to 0 ~ sampleRate/2. Output X-axis is in Hz.' }
    ]
  },
  custom: {
    type: 'custom', title: '自定义节点', titleEn: 'Custom Node',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'name', label: '节点名称', labelEn: 'Node Name', type: 'text', default: '' },
      { id: 'inputCount', label: '输入端口数量', labelEn: 'Input Port Count', type: 'number', default: 1, affectsPorts: true },
      { id: 'outputCount', label: '输出端口数量', labelEn: 'Output Port Count', type: 'number', default: 1, affectsPorts: true },
      { id: 'inputNames', label: '输入端口名称', labelEn: 'Input Port Names', type: 'portNames', direction: 'in', default: {} },
      { id: 'outputNames', label: '输出端口名称', labelEn: 'Output Port Names', type: 'portNames', direction: 'out', default: {} },
      { id: 'code', label: 'JS 算法', labelEn: 'JS Algorithm', type: 'code',
        default: '// === 自定义节点 JS 脚本 ===\n' +
'// 本代码运行在 async 函数体内，支持 await。\n' +
'// 引擎会等待此函数返回后，再将结果推给下游节点。\n' +
'//\n' +
'// 可用变量（已注入，直接使用）：\n' +
'//   signal   — number[]，第一个输入端口的数组（兼容旧写法）\n' +
'//   inputs   — object，所有输入端口的数组，如 inputs.in、inputs.in2、inputs.in3\n' +
'//   sampleRate — number，采样率（Hz）\n' +
'//   sleep(ms) — async 函数，暂停 ms 毫秒；用户按 ESC 或 F5 会抛出 AbortError 打断等待\n' +
'//   aborted() — 返回 boolean，用户是否已取消本次执行（可在循环中轮询）\n' +
'//\n' +
'// 返回值规范：\n' +
'//   单输出端口 → return number[]   (如 return signal.map(v => Math.abs(v)))\n' +
'//   多输出端口 → return { out: number[], out2: number[], out3: number[] }\n' +
'//   ⚠ 不要 return Promise 对象，确保所有 await 在 return 之前完成。\n' +
'//\n' +
'// 示例1（同步滤波）：\n' +
'//   return signal.map(v => v > 0 ? v : 0);  // 半波整流\n' +
'//\n' +
'// 示例2（WebSocket 实时采集，阻塞等待收够 N 点后解析）：\n' +
'//   const ws = new WebSocket(\'ws://192.168.1.1:8080/stream\');\n' +
'//   ws.binaryType = \'arraybuffer\';\n' +
'//   const buf = [];\n' +
'//   await new Promise((resolve, reject) => {\n' +
'//     const timer = setTimeout(() => { ws.close(); reject(new Error(\'超时\')); }, 10000);\n' +
'//     ws.onmessage = (e) => { buf.push(...new Float32Array(e.data)); if (buf.length >= 512) { clearTimeout(timer); ws.close(); resolve(); } };\n' +
'//     ws.onerror = () => { clearTimeout(timer); reject(new Error(\'连接失败\')); };\n' +
'//   });\n' +
'//   // 协议解析：假设每 2 字节小端序组成一个 12 位 ADC 值\n' +
'//   // return buf.map(v => (v - 2048) / 2048);\n' +
'//   return buf;\n' +
'//\n' +
'return signal;' },
      { id: '_info', label: '', type: 'info', default: '<strong>async/await 支持：</strong>代码运行在 async 函数中，可使用 await 等待异步操作（如 WebSocket 收数据）。引擎会等待函数返回后再推给下游节点。\n<strong>sleep(ms)：</strong>暂停 ms 毫秒，可被 ESC/F5 取消打断（抛出 AbortError）。\n<strong>aborted()：</strong>轮询用户是否取消了本次执行，可用于循环终止条件。\n<strong>返回值：</strong>单输出 return 数组；多输出 return { out: 数组, out2: 数组 }。不要 return Promise 对象。\n<strong>调试：</strong>用 console.log 输出到浏览器开发者工具（F12）。', defaultEn: '<strong>async/await support:</strong> Code runs inside an async function; you can use await for async operations (e.g. WebSocket data). The engine waits for the function to return before pushing to downstream nodes.\n<strong>sleep(ms):</strong> Pauses for ms milliseconds; can be cancelled by ESC/F5 (throws AbortError).\n<strong>aborted():</strong> Polls whether the user has cancelled execution; useful as a loop termination condition.\n<strong>Return value:</strong> Single output → return array; Multiple outputs → return { out: array, out2: array }. Do NOT return a Promise object.\n<strong>Debugging:</strong> Use console.log to output to browser DevTools (F12).' }
    ]
  },
  note: {
    type: 'note', title: '便签', titleEn: 'Note',
    inputs: [], outputs: [],
    params: [
      { id: 'text', label: '内容', labelEn: 'Content', type: 'noteText', default: '写下备注...' }
    ]
  },
  splitter: {
    type: 'splitter', title: '分流器', titleEn: 'Splitter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out1', label: '输出1', labelEn: 'Output 1' }, { id: 'out2', label: '输出2', labelEn: 'Output 2' }],
    params: [
      { id: 'count', label: '输出数量', labelEn: 'Output Count', type: 'number', default: 2, affectsPorts: true },
      { id: '_info', label: '', type: 'info', default: '一路信号复制为 N 路完全相同的输出，输出数量可配置。用于将同一信号同时送入多个下游节点。', defaultEn: 'Copies one signal to N identical outputs. Output count is configurable. Used to feed the same signal to multiple downstream nodes simultaneously.' }
    ]
  },
  switch: {
    type: 'switch', title: '开关', titleEn: 'Switch',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'count', label: '端口数量', labelEn: 'Port Count', type: 'number', default: 1, affectsPorts: true },
      { id: 'enabled', label: '允许通过', labelEn: 'Allow Pass-through', type: 'checkbox', default: true }
    ]
  },
  multiplexer: {
    type: 'multiplexer', title: '多路选择器', titleEn: 'Multiplexer',
    inputs: [{ id: 'in1', label: '输入1', labelEn: 'Input 1' }, { id: 'in2', label: '输入2', labelEn: 'Input 2' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'count', label: '端口数量', labelEn: 'Port Count', type: 'number', default: 2, affectsPorts: true },
      { id: 'mode', label: '方向', type: 'select', options: ['多入一出', '一入多出'], optionsEn: ['Many-to-One', 'One-to-Many'], default: '多入一出', affectsPorts: true },
      { id: 'routes', label: '启用通道', type: 'routeChecks', default: {} },
      { id: '_info', label: '', type: 'info', default: '<strong>\"多入一出\"：</strong>从多路输入中选一路输出。<strong>\"一入多出\"：</strong>一路输入复制到多路输出（可启用/禁用各通道）。\n用\"上一个/下一个\"按钮切换选中的通道。只显示已启用的通道。', defaultEn: '<strong>"Many-to-One":</strong> Select one input to output. <strong>"One-to-Many":</strong> Copy one input to multiple outputs (each channel can be enabled/disabled).\nUse Prev/Next buttons to switch the selected channel. Only enabled channels are shown.' }
    ]
  },
  weightedmixer: {
    type: 'weightedmixer', title: '加权合成器', titleEn: 'Weighted Mixer',
    inputs: [{ id: 'in1', label: '输入1', labelEn: 'Input 1' }, { id: 'in2', label: '输入2', labelEn: 'Input 2' }],
    outputs: [{ id: 'out', label: '合成输出', labelEn: 'Mix Output' }],
    params: [
      { id: 'count', label: '输入数量', labelEn: 'Input Count', type: 'number', default: 2, affectsPorts: true },
      { id: 'weights', label: '输入权重', labelEn: 'Input Weights', type: 'inputWeights', default: {} },
      { id: '_info', label: '', type: 'info', default: '多路信号按各自权重逐点加权求和：out[i]=Σ(in_k[i]×w_k)。\n未设置的权重默认为 1。可用于混合多路信号或实现软切换。', defaultEn: 'Weighted sum of multiple signals: out[i]=Σ(in_k[i]×w_k).\nUnset weights default to 1. Useful for mixing signals or soft switching.' }
    ]
  },
  argselector: {
    type: 'argselector', title: '比较选择器', titleEn: 'Arg Selector',
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
      { id: '_info', label: '', type: 'info', default: '<strong>每组两个输入：</strong>信号（被选择的数据）和比较信号（选择依据）。\n在每个时间点，比较所有组的比较信号，选出最大/最小值所在的那一组，输出该组的信号值。\n<strong>异常值输出（可选）：</strong>当优胜比较值大于/小于设定阈值时，不输出信号值，改为输出用户指定的异常值（如 0）。用于标记比较信号异常的时刻。\n<strong>示例：</strong>组1信号=[1,2,3] 比较=[5,1,8]，组2信号=[4,5,6] 比较=[3,9,2]\n模式=最大值 → 比较值 [5,3]→组1胜, [1,9]→组2胜, [8,2]→组1胜 → 输出 [1,5,3]', defaultEn: '<strong>Each group has two inputs:</strong> Signal (data to select) and Compare (selection basis).\nAt each time point, compares all groups\' compare values, selects the group with the max/min compare value, and outputs that group\'s signal.\n<strong>Fallback output (optional):</strong> When the winning compare value exceeds/falls below the threshold, outputs a user-specified fallback value (e.g. 0) instead of the signal. Useful for flagging abnormal periods.\n<strong>Example:</strong> Group1 signal=[1,2,3] compare=[5,1,8], Group2 signal=[4,5,6] compare=[3,9,2]\nMode=Maximum → compare [5,3]→G1 wins, [1,9]→G2 wins, [8,2]→G1 wins → output [1,5,3]' }
    ]
  },
  cutbeg: {
    type: 'cutbeg', title: 'Cut Beg',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'percent', label: '裁剪比例 (%)', labelEn: 'Cut Ratio (%)', type: 'number', default: 10 },
      { id: 'mode', label: '模式', labelEn: 'Mode', type: 'select', options: ['裁剪', '置零'], optionsEn: ['Trim', 'Zero'], default: '裁剪' }
    ]
  },
  cutend: {
    type: 'cutend', title: 'Cut End',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'percent', label: '裁剪比例 (%)', labelEn: 'Cut Ratio (%)', type: 'number', default: 10 },
      { id: 'mode', label: '模式', labelEn: 'Mode', type: 'select', options: ['裁剪', '置零'], optionsEn: ['Trim', 'Zero'], default: '裁剪' }
    ]
  },
  cutrange: {
    type: 'cutrange', title: 'Cut Range',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'start', label: '起始 (%)', labelEn: 'Start (%)', type: 'number', default: 20 },
      { id: 'end', label: '结束 (%)', labelEn: 'End (%)', type: 'number', default: 80 },
      { id: 'mode', label: '模式', labelEn: 'Mode', type: 'select', options: ['裁剪', '置零'], optionsEn: ['Trim', 'Zero'], default: '裁剪' }
    ]
  },
  keeprange: {
    type: 'keeprange', title: 'Keep Range',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'start', label: '起始 (%)', labelEn: 'Start (%)', type: 'number', default: 20 },
      { id: 'end', label: '结束 (%)', labelEn: 'End (%)', type: 'number', default: 80 },
      { id: 'mode', label: '模式', labelEn: 'Mode', type: 'select', options: ['裁剪', '置零'], optionsEn: ['Trim', 'Zero'], default: '裁剪' }
    ]
  },
  avgwin: {
    type: 'avgwin', title: 'Avg Win',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 5 }
    ]
  },
  avgpool: {
    type: 'avgpool', title: 'Avg Pool',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'size', label: '池化大小', labelEn: 'Pool Size', type: 'number', default: 4 }
    ]
  },
  maxpool: {
    type: 'maxpool', title: 'Max Pool',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'size', label: '池化大小', labelEn: 'Pool Size', type: 'number', default: 4 }
    ]
  },
  limiter: {
    type: 'limiter', title: '限位器', titleEn: 'Limiter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'min', label: '最小值', labelEn: 'Min', type: 'number', default: -1 },
      { id: 'max', label: '最大值', labelEn: 'Max', type: 'number', default: 1 }
    ]
  },
  multiplier: {
    type: 'multiplier', title: '乘法器', titleEn: 'Multiplier',
    inputs: [{ id: 'a', label: 'A', labelEn: 'A' }, { id: 'b', label: 'B' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'value', label: 'B值 (B未连接时)', labelEn: 'B Value (when not connected)', type: 'number', default: 2 }
    ]
  },
  adder: {
    type: 'adder', title: '加法器', titleEn: 'Adder',
    inputs: [{ id: 'a', label: 'A', labelEn: 'A' }, { id: 'b', label: 'B' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'value', label: 'B值 (B未连接时)', labelEn: 'B Value (when not connected)', type: 'number', default: 0 }
    ]
  },
  subtractor: {
    type: 'subtractor', title: '减法器', titleEn: 'Subtractor',
    inputs: [{ id: 'a', label: 'A', labelEn: 'A' }, { id: 'b', label: 'B' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'value', label: 'B值 (B未连接时)', labelEn: 'B Value (when not connected)', type: 'number', default: 0 }
    ]
  },
  inverter: {
    type: 'inverter', title: '反相器', titleEn: 'Inverter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: []
  },
  normalizer: {
    type: 'normalizer', title: '归一化', titleEn: 'Normalizer',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'mode', label: '范围模式', labelEn: 'Range Mode', type: 'select', options: ['全部', '窗口'], optionsEn: ['Global', 'Windowed'], default: '全部' },
      { id: 'window', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 32, enabledWhen: { param: 'mode', value: '窗口' } },
      { id: '_info', label: '', type: 'info', default: '将信号线性映射到 [-1, 1] 范围。\"全部\"用整个缓冲区做一次 min-max 归一化；\"窗口\"用滑动窗口逐点归一化，适合幅值随时间变化的信号。', defaultEn: 'Linearly maps the signal to the [-1, 1] range. "Global" uses the entire buffer for a single min-max normalization; "Windowed" normalizes point-by-point with a sliding window, suitable for signals with time-varying amplitude.' }
    ]
  },
  phaseshifter: {
    type: 'phaseshifter', title: '移相器', titleEn: 'Phase Shifter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'shift', label: '偏移点数 (负=左移, 正=右移)', labelEn: 'Shift (neg=left, pos=right)', type: 'number', default: 10 }
    ]
  },
  logmultiplier: {
    type: 'logmultiplier', title: '对数乘法器', titleEn: 'Log Multiplier',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: '_info', label: '', type: 'info', default: 'out = x·log(1+|x|)/log(1+max)', defaultEn: 'out = x·log(1+|x|)/log(1+max)' }
    ]
  },
  entropy: {
    type: 'entropy', title: '因果窗口信息熵', titleEn: 'Causal Window Entropy',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'window', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 32 },
      { id: 'bins', label: '分桶数量', labelEn: 'Bin Count', type: 'number', default: 16 },
      { id: '_info', label: '', type: 'info', default: '在因果窗口内将信号幅值等距分桶，计算 Shannon 信息熵（单位 bit）。\n<strong>熵高</strong>→幅值分布均匀（噪声/复杂信号）；<strong>熵低</strong>→幅值集中在少数区间（规律信号如正弦波）。\n<strong>分桶</strong>越多分辨力越强但噪声敏感度也越高。', defaultEn: 'Divides the signal amplitude into equal-width bins within a causal window, then computes Shannon entropy (in bits).\n<strong>High entropy</strong> → uniform amplitude distribution (noise/complex signals); <strong>Low entropy</strong> → amplitude concentrated in few bins (regular signals like sine waves).\n<strong>More bins</strong> → higher resolution but more noise-sensitive.' }
    ]
  },
  squarewave: {
    type: 'squarewave', title: '矩形波检测器', titleEn: 'Square Wave Detector',
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
  },
  abs: {
    type: 'abs', title: '绝对值', titleEn: 'Absolute Value',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: []
  },
  hysteresis: {
    type: 'hysteresis', title: '迟滞比较器', titleEn: 'Hysteresis Comparator',
    inputs: [{ id: 'a', label: 'A', labelEn: 'A' }, { id: 'b', label: 'B(阈值)', labelEn: 'B(Thresh)' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'threshold', label: '阈值 (B未连接时)', labelEn: 'Threshold (B not connected)', type: 'number', default: 0.5 },
      { id: 'hyst', label: '迟滞 (0=禁用)', labelEn: 'Hysteresis (0=off)', type: 'number', default: 0.1 },
      { id: '_info', label: '', type: 'info', default: '将连续信号转为 0/1 方波。信号 > 阈值+Hyst → 输出 1；信号 < 阈值-Hyst → 输出 0；中间区域保持上一状态。\n<strong>迟滞</strong>越大抗噪越强，但会延迟翻转时刻。<strong>hyst=0</strong> 退化为普通过零比较器。\n<strong>B 端口</strong>未连接时使用参数\"阈值\"；连接后使用 B 端口的逐点值作为阈值。', defaultEn: 'Converts a continuous signal to a 0/1 square wave. Signal > threshold+Hyst → output 1; Signal < threshold-Hyst → output 0; in between, holds previous state.\n<strong>Larger hysteresis</strong> gives better noise immunity but delays transition timing. <strong>hyst=0</strong> degenerates to a plain zero-crossing comparator.\n<strong>Port B</strong> not connected → uses the "Threshold" parameter; connected → uses port B\'s per-sample value as the threshold.' }
    ]
  },
  kalman: {
    type: 'kalman', title: '卡尔曼滤波', titleEn: 'Kalman Filter',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'q', label: '过程噪声 Q', labelEn: 'Process Noise Q', type: 'number', default: 0.01 },
      { id: 'r', label: '测量噪声 R', labelEn: 'Measurement Noise R', type: 'number', default: 0.1 },
      { id: '_info', label: '', type: 'info', default: 'x̂ = x̂ + K(z-x̂), K=P/(P+R)', defaultEn: 'x̂ = x̂ + K(z-x̂), K=P/(P+R)' }
    ]
  },
  medianwin: {
    type: 'medianwin', title: '中值窗口', titleEn: 'Median Window',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 5 },
      { id: '_info', label: '', type: 'info', default: '输出窗口内中位数。比均值更抗孤立尖峰干扰，适合去除椒盐噪声。', defaultEn: 'Outputs the window median. More robust against isolated spikes than mean, suitable for removing salt-and-pepper noise.' }
    ]
  },
  maxwin: {
    type: 'maxwin', title: 'Max Win',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 5 }
    ]
  },
  minwin: {
    type: 'minwin', title: 'Min Win',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 5 }
    ]
  },
  extremewin: {
    type: 'extremewin', title: '极值窗口', titleEn: 'Extreme Window',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 5 },
      { id: '_info', label: '', type: 'info', default: '输出窗口内 max-min 差值（峰峰值）。衡量信号局部波动幅度。', defaultEn: 'Outputs the max-min difference (peak-to-peak) within the window. Measures local signal fluctuation amplitude.' }
    ]
  },
  probe: {
    type: 'probe', title: '示波器', titleEn: 'Oscilloscope',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'name', label: '示波器名称', labelEn: 'Oscilloscope Name', type: 'text', default: '' },
      { id: 'color', label: '颜色', labelEn: 'Color', type: 'color', default: '' },
      { id: 'enabled', label: '启用', labelEn: 'Enabled', type: 'checkbox', default: true }
    ]
  },
  csvoutput: {
    type: 'csvoutput', title: 'CSV 输出', titleEn: 'CSV Output',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [],
    params: [
      { id: 'name', label: '文件名', labelEn: 'Filename', type: 'text', default: 'signal_output' },
      { id: 'autoExport', label: '允许自动导出', labelEn: 'Allow Auto Export', type: 'checkbox', default: false },
      { id: 'info', label: '说明', labelEn: 'Info', type: 'info', default: '可手动导出；自动导出需同时打开右上角开关' }
    ]
  },
  dcoffset: {
    type: 'dcoffset', title: '去直流偏置', titleEn: 'DC Offset Remover',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: '_info', label: '', type: 'info', default: 'y[i] = x[i] - mean(x)。消除信号直流分量，使波形围绕零点振荡。', defaultEn: 'y[i] = x[i] - mean(x). Removes the DC component so the waveform oscillates around zero.' }
    ]
  },
  differentiator: {
    type: 'differentiator', title: '微分器', titleEn: 'Differentiator',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: '_info', label: '', type: 'info', default: 'y[i] = x[i] - x[i-1]。计算信号逐点变化率（一阶差分）。', defaultEn: 'y[i] = x[i] - x[i-1]. Computes the per-sample rate of change (first-order difference).' }
    ]
  },
  stdwin: {
    type: 'stdwin', title: '滑动标准差', titleEn: 'Sliding Std Dev',
    inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
    outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
    params: [
      { id: 'size', label: '窗口大小', labelEn: 'Window Size', type: 'number', default: 16 },
      { id: '_info', label: '', type: 'info', default: '窗口内信号标准差，衡量局部波动强度。窗口越大越平滑。', defaultEn: 'Standard deviation within the window, measuring local fluctuation intensity. Larger windows give smoother output.' }
    ]
  },
  interval2bpm: {
    type: 'interval2bpm', title: '间隔→BPM', titleEn: 'Interval→BPM',
    inputs: [{ id: 'in', label: '间隔输入', labelEn: 'Interval Input' }],
    outputs: [{ id: 'out', label: 'BPM' }],
    params: [
      { id: '_info', label: '', type: 'info', default: 'BPM = 60 × 采样率 / 间隔点数。输入为 0 时输出 0；输入为负数/NaN 时保持上一有效值。', defaultEn: 'BPM = 60 × sampleRate / intervalSamples. Outputs 0 when input is 0; holds the last valid value when input is negative or NaN.' }
    ]
  },
  peakdetector: {
    type: 'peakdetector', title: '峰谷检测器', titleEn: 'Peak/Valley Detector',
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
  }
};

export { NODE_DEFS };

