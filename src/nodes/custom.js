// Custom Node: user-written JS code
export const def = {
  type: 'custom',
  title: '自定义节点', titleEn: 'Custom Node',
  category: '辅助', categoryEn: 'Utilities',
  color: '#27ae60',
  sidebar: '自定义节点', sidebarEn: 'Custom Node',
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
'//   variables — object，当前管线变量表，如 variables.a\n' +
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
};

export function process(getInput, params, ctx) {
  return { _isCustom: true };
}
