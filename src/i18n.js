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

  // Dynamic port label templates (for multi-port nodes)
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
