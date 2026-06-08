// ============================================================
//  I18N - Internationalization
// ============================================================

const I18N_EN = {
  // Page title & status
  '信号处理实验室': 'Signal Processing Lab',
  '运行中': 'Running',
  '运行完成': 'Complete',
  '准备运行': 'Preparing...',
  '生成图表': 'Rendering charts',
  '已取消': 'Cancelled',
  '已取消，可重新运行': 'Cancelled, ready to re-run',
  '运行后在此显示波形': 'Waveforms appear here after running',

  // Sidebar group titles
  '输入和输出': 'Input & Output',
  '滤波器': 'Filters',
  '频域分析': 'Frequency Domain',
  '运算与变换': 'Operations & Transform',
  '特征提取': 'Feature Extraction',
  '窗口统计': 'Window Statistics',
  '降采样': 'Downsampling',
  '裁剪截取': 'Trim & Cut',
  '流程控制': 'Flow Control',
  '辅助': 'Utilities',

  // Sidebar node names
  'CSV 输入': 'CSV Input',
  '信号发生器': 'Signal Generator',
  'CSV 输出': 'CSV Output',
  '示波器': 'Oscilloscope',
  '低通滤波': 'Lowpass Filter',
  '高通滤波': 'Highpass Filter',
  '带通滤波': 'Bandpass Filter',
  '指数平均滤波': 'Exponential Avg Filter',
  'FIR 线性相位': 'FIR Linear Phase',
  'Hampel滤波': 'Hampel Filter',
  '卡尔曼滤波': 'Kalman Filter',
  'FFT 频谱': 'FFT Spectrum',
  '乘法器': 'Multiplier',
  '加权合成器': 'Weighted Mixer',
  '加法器': 'Adder',
  '减法器': 'Subtractor',
  '反相器': 'Inverter',
  '绝对值': 'Absolute Value',
  '对数乘法器': 'Log Multiplier',
  '归一化': 'Normalizer',
  '限位器': 'Limiter',
  '移相器': 'Phase Shifter',
  '迟滞比较器': 'Hysteresis Comparator',
  '去直流偏置': 'DC Offset Remover',
  '微分器': 'Differentiator',
  '峰谷检测器': 'Peak/Valley Detector',
  '间隔→BPM': 'Interval→BPM',
  '矩形波检测器': 'Square Wave Detector',
  '中值窗口': 'Median Window',
  '极值窗口': 'Extreme Window',
  '滑动标准差': 'Sliding Std Dev',
  '因果窗口熵': 'Causal Window Entropy',
  '分流器': 'Splitter',
  '开关': 'Switch',
  '多路选择器': 'Multiplexer',
  '比较选择器': 'Arg Selector',
  '自定义节点': 'Custom Node',
  '便签': 'Note',

  // Sidebar buttons
  '演示数据': 'Demo Data',
  '清空画布': 'Clear Canvas',
  '导出 JSON': 'Export JSON',
  '导入 JSON': 'Import JSON',

  // Chart header
  '波形显示': 'Waveform Display',
  '复制上下文': 'Copy Context',
  '自动导出': 'Auto Export',
  '运行 (F5)': 'Run (F5)',
  '秒': 's',

  // Empty hint
  '从左侧栏拖拽节点到画布': 'Drag nodes from the sidebar to the canvas',
  '从输出端口 (右侧圆点) 拖拽到输入端口 (左侧圆点) 连线': 'Drag from output port (right dot) to input port (left dot) to connect',
  '画布空白处左键拖拽框选，拖动已选节点可整体移动': 'Left-drag on empty canvas to box-select, drag selected nodes to move together',
  '点击连线变红后再点删除 / 右键直接删除': 'Click a connection to mark it red, then click again to delete / right-click to delete directly',
  '按 Delete 键删除选中节点 / F5 运行': 'Press Delete to remove selected nodes / F5 to run',
  '鼠标中键拖拽平移视图 / 空格键复位': 'Middle-mouse drag to pan / Space to reset view',
  '点击左下角「演示数据」可快速体验': 'Click "Demo Data" in the sidebar for a quick start',

  // Node parameter labels
  '备注名': 'Note',
  '采样率 (Hz)': 'Sample Rate (Hz)',
  '波形数据': 'Waveform Data',
  '长度参考': 'Length Reference',
  '频率 (Hz)': 'Frequency (Hz)',
  '高电平': 'High Level',
  '低电平': 'Low Level',
  '输出长度': 'Output Length',
  '截止频率 (Hz)': 'Cutoff Freq (Hz)',
  '阶数 (1~8)': 'Order (1~8)',
  '低截止 (Hz)': 'Low Cut (Hz)',
  '高截止 (Hz)': 'High Cut (Hz)',
  '平滑系数 α (0~1)': 'Smoothing α (0~1)',
  '抽头数量 (奇数)': 'Taps (odd)',
  '窗口大小': 'Window Size',
  '阈值倍数': 'Threshold Factor',
  'MAD 缩放系数': 'MAD Scale',
  'FFT 点数': 'FFT Points',
  '最小频率 (Hz)': 'Min Freq (Hz)',
  '最大频率 (Hz)': 'Max Freq (Hz)',
  '节点名称': 'Node Name',
  '输入端口数量': 'Input Port Count',
  '输出端口数量': 'Output Port Count',
  '输入端口名称': 'Input Port Names',
  '输出端口名称': 'Output Port Names',
  'JS 算法': 'JS Algorithm',
  '内容': 'Content',
  '示波器名称': 'Oscilloscope Name',
  '颜色': 'Color',
  '启用': 'Enabled',
  '文件名': 'Filename',
  '允许自动导出': 'Allow Auto Export',
  '说明': 'Info',
  '输出数量': 'Output Count',
  '端口数量': 'Port Count',
  '允许通过': 'Allow Pass-through',
  '输入数量': 'Input Count',
  '输入权重': 'Input Weights',
  '输入组数': 'Input Group Count',
  '比较模式': 'Compare Mode',
  '启用异常值输出': 'Enable Fallback Output',
  '异常条件': 'Fallback Condition',
  '阈值': 'Threshold',
  '异常值': 'Fallback Value',
  '裁剪比例 (%)': 'Cut Ratio (%)',
  '模式': 'Mode',
  '起始 (%)': 'Start (%)',
  '结束 (%)': 'End (%)',
  '池化大小': 'Pool Size',
  '最小值': 'Min',
  '最大值': 'Max',
  'B值 (B未连接时)': 'B Value (when not connected)',
  '范围模式': 'Range Mode',
  '偏移点数 (负=左移, 正=右移)': 'Shift (neg=left, pos=right)',
  '分桶数量': 'Bin Count',
  '窗口大小': 'Window Size',
  '阈值模式': 'Threshold Mode',
  '手动阈值': 'Manual Threshold',
  '最少边沿数': 'Min Edges',
  '阈值 (B未连接时)': 'Threshold (B not connected)',
  '迟滞 (0=禁用)': 'Hysteresis (0=off)',
  '过程噪声 Q': 'Process Noise Q',
  '测量噪声 R': 'Measurement Noise R',
  '输出': 'Output',
  '输入': 'Input',
  '滤波结果': 'Filtered',
  '幅值谱': 'Magnitude Spectrum',
  '合成输出': 'Mix Output',
  '规律度': 'Regularity',
  '周期': 'Period',
  '占空比': 'Duty',
  '抖动': 'Jitter',
  'A': 'A',
  'B(阈值)': 'B(Thresh)',
  '信号': 'Signal',
  '触发': 'Trigger',
  '间隔输入': 'Interval Input',
  '峰值脉冲': 'Peak Pulse',
  '谷值脉冲': 'Valley Pulse',
  '峰峰间隔': 'Peak-to-Peak',
  '谷谷间隔': 'Valley-to-Valley',
  '峰峰间隔(紧凑)': 'Peak-Peak (Compact)',
  '谷谷间隔(紧凑)': 'Valley-Valley (Compact)',
  '触发峰间隔': 'Trig Peak Interval',
  '触发峰间隔(紧凑)': 'Trig Peak Intvl (Compact)',
  '触发谷间隔': 'Trig Valley Interval',
  '触发谷间隔(紧凑)': 'Trig Valley Intvl (Compact)',
  '峰谷间隔 S&H 输出': 'Peak/Valley S&H Output',
  '峰谷间隔 紧凑 输出': 'Peak/Valley Compact Output',
  '触发间隔输出 (out7~10)': 'Trig Interval Output (out7~10)',

  // Node titles
  '低通滤波器': 'Lowpass Filter',
  '高通滤波器': 'Highpass Filter',
  '带通滤波器': 'Bandpass Filter',
  '指数平均滤波器': 'Exponential Avg Filter',
  'FIR 线性相位滤波器': 'FIR Linear Phase Filter',
  'Hampel滤波器': 'Hampel Filter',
  '限位器': 'Limiter',
  '归一化': 'Normalizer',
  '移相器': 'Phase Shifter',
  '对数乘法器': 'Log Multiplier',
  '因果窗口信息熵': 'Causal Window Entropy',
  '矩形波检测器': 'Square Wave Detector',
  '迟滞比较器': 'Hysteresis Comparator',
  '卡尔曼滤波': 'Kalman Filter',
  '中值窗口': 'Median Window',
  '极值窗口': 'Extreme Window',
  '滑动标准差': 'Sliding Std Dev',
  '间隔→BPM': 'Interval→BPM',
  '峰谷检测器': 'Peak/Valley Detector',
  'CSV 输入': 'CSV Input',
  '信号发生器': 'Signal Generator',
  'CSV 输出': 'CSV Output',
  '示波器': 'Oscilloscope',
  '乘法器': 'Multiplier',
  '加法器': 'Adder',
  '减法器': 'Subtractor',
  '反相器': 'Inverter',
  '分流器': 'Splitter',
  '开关': 'Switch',
  '多路选择器': 'Multiplexer',
  '比较选择器': 'Arg Selector',
  '加权合成器': 'Weighted Mixer',
  '自定义节点': 'Custom Node',
  '便签': 'Note',
  '去直流偏置': 'DC Offset Remover',
  '微分器': 'Differentiator',

  // Select option values
  '最大值': 'Maximum',
  '最小值': 'Minimum',
  '大于阈值': 'Greater than threshold',
  '小于阈值': 'Less than threshold',
  '多入一出': 'Many-to-One',
  '一入多出': 'One-to-Many',
  '全部': 'Global',
  '窗口': 'Windowed',
  '自动': 'Auto',
  '手动': 'Manual',
  '裁剪': 'Trim',
  '置零': 'Zero',

  // Dynamic port labels
  '信号{0}': 'Signal {0}',
  '比较{0}': 'Compare {0}',
  '输入{0}': 'Input {0}',
  '输出{0}': 'Output {0}',

  // Toast messages
  '已复制 {0} 个节点': 'Copied {0} node(s)',
  '已粘贴 {0} 个节点': 'Pasted {0} node(s)',
  '画布已清空': 'Canvas cleared',
  '已导入 {0} 个采样点': 'Imported {0} sample(s)',
  '已加载演示数据，点击「运行」查看波形': 'Demo data loaded. Click "Run" to view waveforms',
  '正在运行 {0}': 'Running {0}',
  '等待 {0}': 'Waiting {0}',
  '自定义节点错误: {0}': 'Custom node error: {0}',
  '对数乘法器 #{0} 符号异常': 'Log multiplier #{0} sign anomaly',
  '请先添加 CSV 输入节点': 'Please add a CSV input node first',
  '运行完成': 'Run complete',
  '上下文已复制到剪贴板': 'Context copied to clipboard',
  '复制失败，请重试': 'Copy failed, please retry',
  '项目已导出': 'Project exported',
  '项目已导入': 'Project imported',
  '导入失败: {0}': 'Import failed: {0}',
  '确定清空画布？所有节点和连线将被删除。': 'Clear canvas? All nodes and connections will be deleted.',

  // Run status
  '已取消': 'Cancelled',
  '已取消，可重新运行': 'Cancelled, ready to re-run',

  // CSV / File / Chart
  '已加载 {0} 点': 'Loaded {0} points',
  '导出 CSV': 'Export CSV',
  '📁 选择 CSV 文件': '📁 Choose CSV File',
  '输入信号 - {0}': 'Input Signal - {0}',
  '输入信号 #{0}': 'Input Signal #{0}',
  '频率': 'Frequency',
  '采样': 'Sample',
  '隐藏': 'Hide',
  '显示': 'Show',
  '隐藏波形': 'Hide waveform',
  '显示波形': 'Show waveform',
  '频率 {0} Hz': 'Freq {0} Hz',
  '幅值': 'Amplitude',
  '通道 {0}': 'Ch {0}',
  '上一个': 'Prev',
  '下一个': 'Next',
  '随机': 'Random',
  '没有数据可显示': 'No data to display',
  '无效的项目文件': 'Invalid project file',
  '双击重命名': 'Double-click to rename',
  '点击切换显示/隐藏': 'Click to toggle visibility',
  '复制项目上下文到剪贴板，可粘贴到外部 AI 分析': 'Copy project context to clipboard for AI analysis',
  '刷新间隔(秒)': 'Refresh interval (seconds)',
  'GitHub 仓库': 'GitHub Repository',

  // Undo/Redo
  '撤销': 'Undo',
  '重做': 'Redo',

  // Misc
  '写下备注...': 'Write a note...',
  '原始信号': 'Raw Signal',
  '低通滤波后': 'After Lowpass',
  '高通滤波后': 'After Highpass',
};

const I18N = {
  locale: localStorage.getItem('signal-lab-lang') || 'zh',

  // External UI text — lookup from I18N_EN map
  t(key, ...args) {
    if (this.locale === 'zh') {
      return args.length ? key.replace(/\{(\d+)\}/g, (_, i) => String(args[i] ?? '')) : key;
    }
    let translated = I18N_EN[key];
    if (translated === undefined) {
      translated = key;
    }
    if (args.length) {
      translated = translated.replace(/\{(\d+)\}/g, (_, i) => String(args[i] ?? ''));
    }
    return translated;
  },

  // Node-internal text — enKey from NODE_DEFS, falls back to I18N_EN map
  tn(key, enKey) {
    if (this.locale === 'zh') return key;
    return enKey || I18N_EN[key] || key;
  },

  setLocale(locale) {
    this.locale = locale;
    localStorage.setItem('signal-lab-lang', locale);
    this.updateDOM();
    // Update language toggle button text
    const btn = document.getElementById('langToggle');
    if (btn) btn.textContent = locale === 'zh' ? 'EN' : '中';
  },

  updateDOM() {
    document.title = this.t('信号处理实验室');
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.title = this.t(key);
    });
  }
};

export { I18N, I18N_EN };
