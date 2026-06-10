const sampleRate = 1000;
const length = 2000;
const carrierFrequency = 80;
const basebandCutoff = 20;

export function createIqDemoBlueprint() {
  const nodes = [
    {
      key: 'iBaseband',
      type: 'signalgen',
      x: 60,
      y: 90,
      params: {
        waveform: '正弦波',
        frequency: 4,
        phase: 0,
        high: 0.75,
        low: -0.75,
        length
      }
    },
    {
      key: 'qBaseband',
      type: 'signalgen',
      x: 60,
      y: 260,
      params: {
        waveform: '正弦波',
        frequency: 6,
        phase: 90,
        high: 0.65,
        low: -0.65,
        length
      }
    },
    {
      key: 'iCarrier',
      type: 'signalgen',
      x: 60,
      y: 480,
      params: {
        waveform: '正弦波',
        frequency: carrierFrequency,
        phase: 90,
        high: 1,
        low: -1,
        length
      }
    },
    {
      key: 'qCarrier',
      type: 'signalgen',
      x: 60,
      y: 650,
      params: {
        waveform: '正弦波',
        frequency: carrierFrequency,
        phase: 0,
        high: 1,
        low: -1,
        length
      }
    },
    { key: 'iBaseProbe', type: 'probe', x: 330, y: 80, label: '原始 I 基带' },
    { key: 'qBaseProbe', type: 'probe', x: 330, y: 250, label: '原始 Q 基带' },
    { key: 'iModulator', type: 'multiplier', x: 360, y: 460 },
    { key: 'qModulator', type: 'multiplier', x: 360, y: 650 },
    { key: 'rfCombiner', type: 'subtractor', x: 630, y: 550 },
    { key: 'rfProbe', type: 'probe', x: 870, y: 550, label: 'IQ调制信号' },
    { key: 'iDemodMixer', type: 'multiplier', x: 870, y: 750 },
    { key: 'qDemodMixer', type: 'multiplier', x: 870, y: 940 },
    {
      key: 'iRecoveryFilter',
      type: 'lowpass',
      x: 1140,
      y: 750,
      params: { cutoff: basebandCutoff, order: 4 }
    },
    {
      key: 'qRecoveryFilter',
      type: 'lowpass',
      x: 1140,
      y: 940,
      params: { cutoff: basebandCutoff, order: 4 }
    },
    { key: 'iGain', type: 'multiplier', x: 1410, y: 750, params: { value: 2 } },
    { key: 'qGain', type: 'multiplier', x: 1410, y: 940, params: { value: -2 } },
    { key: 'iRecoveredProbe', type: 'probe', x: 1660, y: 750, label: '解调 I 路' },
    { key: 'qRecoveredProbe', type: 'probe', x: 1660, y: 940, label: '解调 Q 路' }
  ];

  const connections = [
    { from: 'iBaseband', fromPort: 'out', to: 'iBaseProbe', toPort: 'in' },
    { from: 'qBaseband', fromPort: 'out', to: 'qBaseProbe', toPort: 'in' },
    { from: 'iBaseProbe', fromPort: 'out', to: 'iModulator', toPort: 'a' },
    { from: 'qBaseProbe', fromPort: 'out', to: 'qModulator', toPort: 'a' },
    { from: 'iCarrier', fromPort: 'out', to: 'iModulator', toPort: 'b' },
    { from: 'qCarrier', fromPort: 'out', to: 'qModulator', toPort: 'b' },
    { from: 'iModulator', fromPort: 'out', to: 'rfCombiner', toPort: 'a' },
    { from: 'qModulator', fromPort: 'out', to: 'rfCombiner', toPort: 'b' },
    { from: 'rfCombiner', fromPort: 'out', to: 'rfProbe', toPort: 'in' },
    { from: 'rfProbe', fromPort: 'out', to: 'iDemodMixer', toPort: 'a' },
    { from: 'rfProbe', fromPort: 'out', to: 'qDemodMixer', toPort: 'a' },
    { from: 'iCarrier', fromPort: 'out', to: 'iDemodMixer', toPort: 'b' },
    { from: 'qCarrier', fromPort: 'out', to: 'qDemodMixer', toPort: 'b' },
    { from: 'iDemodMixer', fromPort: 'out', to: 'iRecoveryFilter', toPort: 'in' },
    { from: 'qDemodMixer', fromPort: 'out', to: 'qRecoveryFilter', toPort: 'in' },
    { from: 'iRecoveryFilter', fromPort: 'out', to: 'iGain', toPort: 'a' },
    { from: 'qRecoveryFilter', fromPort: 'out', to: 'qGain', toPort: 'a' },
    { from: 'iGain', fromPort: 'out', to: 'iRecoveredProbe', toPort: 'in' },
    { from: 'qGain', fromPort: 'out', to: 'qRecoveredProbe', toPort: 'in' }
  ];

  return { sampleRate, nodes, connections };
}
