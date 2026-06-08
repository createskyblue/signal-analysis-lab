// Kalman Filter Node
export const def = {
  type: 'kalman',
  title: '卡尔曼滤波', titleEn: 'Kalman Filter',
  category: '滤波器', categoryEn: 'Filters',
  color: '#2980b9',
  sidebar: '卡尔曼滤波', sidebarEn: 'Kalman Filter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'q', label: '过程噪声 Q', labelEn: 'Process Noise Q', type: 'number', default: 0.01 },
    { id: 'r', label: '测量噪声 R', labelEn: 'Measurement Noise R', type: 'number', default: 0.1 },
    { id: '_info', label: '', type: 'info', default: 'x̂ = x̂ + K(z-x̂), K=P/(P+R)', defaultEn: 'x̂ = x̂ + K(z-x̂), K=P/(P+R)' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const Q = params.q !== undefined ? params.q : 0.01;
  const R = params.r !== undefined ? params.r : 0.1;
  const out = [];
  let x_est = inp.length > 0 ? inp[0] : 0;
  let p_est = 1;
  for (const z of inp) {
    const x_pred = x_est;
    const p_pred = p_est + Q;
    const K = p_pred / (p_pred + R);
    x_est = x_pred + K * (z - x_pred);
    p_est = (1 - K) * p_pred;
    out.push(x_est);
  }
  return { out };
}
