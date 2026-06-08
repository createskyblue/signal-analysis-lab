// Bandpass Filter Node (lowpass + highpass cascade)
import { process as lowpass } from './lowpass.js';
import { process as highpass } from './highpass.js';

export const def = {
  type: 'bandpass',
  title: '带通滤波器', titleEn: 'Bandpass Filter',
  category: '滤波器', categoryEn: 'Filters',
  color: '#8e44ad',
  sidebar: '带通滤波', sidebarEn: 'Bandpass Filter',
  inputs: [{ id: 'in', label: '输入', labelEn: 'Input' }],
  outputs: [{ id: 'out', label: '输出', labelEn: 'Output' }],
  params: [
    { id: 'lowcut', label: '低截止 (Hz)', labelEn: 'Low Cut (Hz)', type: 'number', default: 30 },
    { id: 'highcut', label: '高截止 (Hz)', labelEn: 'High Cut (Hz)', type: 'number', default: 100 },
    { id: 'order', label: '阶数 (1~8)', labelEn: 'Order (1~8)', type: 'number', default: 2, min: 1 },
    { id: '_info', label: '', type: 'info', default: '只保留低截止～高截止之间的频率。阶数越高边缘越陡。⚠️ 两截止频率应相差 2~3 倍以上，靠太近信号严重衰减。', defaultEn: 'Keeps only frequencies between low and high cutoffs. Higher orders give steeper edges. ⚠️ Cutoff frequencies should differ by at least 2-3x; if too close, the signal will be severely attenuated.' }
  ]
};

export function process(getInput, params, ctx) {
  const inp = getInput('in');
  const order = Math.max(1, Math.min(8, Math.floor(params.order || 2)));
  if (!inp.length) return { out: [] };
  const lowParams = { cutoff: params.highcut || 100, order };
  const lowResult = lowpass(() => inp, lowParams, ctx);
  const highParams = { cutoff: params.lowcut || 30, order };
  return highpass(() => lowResult.out, highParams, ctx);
}
