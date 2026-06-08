// ============================================================
//  DSP - Signal Processing Utilities
// ============================================================
export const DSP = {
  lowpass(signal, cutoff, sampleRate, order = 2) {
    if (!signal.length) return [];
    let result = signal;
    for (let stage = 0; stage < order; stage++) {
      const rc = 1.0 / (cutoff * 2 * Math.PI);
      const dt = 1.0 / sampleRate;
      const alpha = dt / (rc + dt);
      const out = [result[0]];
      for (let i = 1; i < result.length; i++) {
        out.push(out[i - 1] + alpha * (result[i] - out[i - 1]));
      }
      result = out;
    }
    return result;
  },

  highpass(signal, cutoff, sampleRate, order = 2) {
    if (!signal.length) return [];
    let result = signal;
    for (let stage = 0; stage < order; stage++) {
      const rc = 1.0 / (cutoff * 2 * Math.PI);
      const dt = 1.0 / sampleRate;
      const alpha = rc / (rc + dt);
      const out = [0];
      for (let i = 1; i < result.length; i++) {
        out.push(alpha * (out[i - 1] + result[i] - result[i - 1]));
      }
      result = out;
    }
    return result;
  },

  bandpass(signal, lowCut, highCut, sampleRate, order = 2) {
    if (!signal.length) return [];
    const low = DSP.lowpass(signal, highCut, sampleRate, order);
    return DSP.highpass(low, lowCut, sampleRate, order);
  },

  weighted(signal, weight) {
    if (!signal.length) return [];
    const w = weight;
    const out = [signal[0]];
    for (let i = 1; i < signal.length; i++) {
      out.push(out[i - 1] * w + signal[i] * (1 - w));
    }
    return out;
  },

  generateSineWave(length, frequency, high, low, sampleRate) {
    const count = Math.max(0, Math.floor(length || 0));
    const center = (high + low) / 2;
    const amplitude = (high - low) / 2;
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push(center + amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate));
    }
    return out;
  },

  nextPowerOfTwo(value) {
    let n = 1;
    const target = Math.max(2, Math.floor(value || 2));
    while (n < target) n <<= 1;
    return n;
  },

  fftInPlace(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        [re[i], re[j]] = [re[j], re[i]];
        [im[i], im[j]] = [im[j], im[i]];
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const angle = -2 * Math.PI / len;
      const wLenRe = Math.cos(angle);
      const wLenIm = Math.sin(angle);
      for (let i = 0; i < n; i += len) {
        let wRe = 1, wIm = 0;
        for (let j = 0; j < len / 2; j++) {
          const uRe = re[i + j];
          const uIm = im[i + j];
          const vRe = re[i + j + len / 2] * wRe - im[i + j + len / 2] * wIm;
          const vIm = re[i + j + len / 2] * wIm + im[i + j + len / 2] * wRe;
          re[i + j] = uRe + vRe;
          im[i + j] = uIm + vIm;
          re[i + j + len / 2] = uRe - vRe;
          im[i + j + len / 2] = uIm - vIm;
          const nextRe = wRe * wLenRe - wIm * wLenIm;
          wIm = wRe * wLenIm + wIm * wLenRe;
          wRe = nextRe;
        }
      }
    }
  },

  fftMagnitudeSpectrum(signal, sampleRate, size, minFreq, maxFreq) {
    const n = DSP.nextPowerOfTwo(size || signal.length || 2);
    const re = new Array(n).fill(0);
    const im = new Array(n).fill(0);
    for (let i = 0; i < Math.min(signal.length, n); i++) re[i] = Number(signal[i]) || 0;
    DSP.fftInPlace(re, im);
    const bins = Math.floor(n / 2) + 1;
    const out = [];
    const freqs = [];
    const min = minFreq === '' || minFreq === undefined ? 0 : Number(minFreq);
    const max = maxFreq === '' || maxFreq === undefined ? sampleRate / 2 : Number(maxFreq);
    const lo = Math.max(0, Math.min(Number.isFinite(min) ? min : 0, sampleRate / 2));
    const hi = Math.max(0, Math.min(Number.isFinite(max) ? max : sampleRate / 2, sampleRate / 2));
    const rangeMin = Math.min(lo, hi);
    const rangeMax = Math.max(lo, hi);
    for (let k = 0; k < bins; k++) {
      const edgeBin = k === 0 || k === n / 2;
      const scale = edgeBin ? 1 / n : 2 / n;
      const freq = k * sampleRate / n;
      if (freq < rangeMin || freq > rangeMax) continue;
      out.push(Math.hypot(re[k], im[k]) * scale);
      freqs.push(freq);
    }
    out._chartType = 'spectrum';
    out._xValues = freqs;
    out._xUnit = 'Hz';
    out._xLabel = '频率';
    return out;
  },

  firLinearLowpassCoefficients(cutoff, sampleRate, taps) {
    const n = Math.max(3, taps);
    const fc = Math.max(0.000001, Math.min(cutoff / sampleRate, 0.499999));
    const mid = (n - 1) / 2;
    const coeffs = [];
    for (let i = 0; i < n; i++) {
      const x = i - mid;
      const sinc = x === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * x) / (Math.PI * x);
      const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
      coeffs.push(sinc * window);
    }
    const sum = coeffs.reduce((acc, v) => acc + v, 0);
    if (sum !== 0) for (let i = 0; i < coeffs.length; i++) coeffs[i] /= sum;
    return coeffs;
  },

  firFilter(signal, coeffs) {
    if (!signal.length || !coeffs.length) return [];
    const center = Math.floor(coeffs.length / 2);
    const out = [];
    for (let i = 0; i < signal.length; i++) {
      let acc = 0;
      for (let k = 0; k < coeffs.length; k++) {
        const idx = i + k - center;
        if (idx >= 0 && idx < signal.length) acc += signal[idx] * coeffs[k];
      }
      out.push(acc);
    }
    return out;
  },

  median(values) {
    if (!values.length) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  hampelMadFilter(signal, windowSize, threshold, scale) {
    if (!signal.length) return { filtered: [], mad: [] };
    const size = Math.max(1, Math.floor(windowSize || 1));
    const half = Math.floor(size / 2);
    threshold = Math.max(0, threshold);
    const filtered = [];
    const madTrace = [];
    for (let i = 0; i < signal.length; i++) {
      const window = [];
      for (let j = i - half; j <= i + half; j++) {
        if (j >= 0 && j < signal.length) window.push(Number(signal[j]) || 0);
      }
      const med = DSP.median(window);
      const deviations = window.map(v => Math.abs(v - med));
      const mad = DSP.median(deviations);
      const sigma = Math.max(0, scale) * mad;
      const current = Number(signal[i]) || 0;
      madTrace.push(mad);
      filtered.push(Math.abs(current - med) > threshold * sigma ? med : current);
    }
    return { filtered, mad: madTrace };
  },

  causalWindowEntropy(signal, windowSize, bins) {
    if (!signal.length) return [];
    const binCount = Math.max(1, Math.floor(bins || 1));
    const size = Math.max(1, Math.floor(windowSize || 1));
    return signal.map((_, i) => {
      const start = Math.max(0, i - size + 1);
      let min = Infinity, max = -Infinity;
      for (let j = start; j <= i; j++) {
        const v = signal[j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (min === max) return 0;
      const hist = new Array(binCount).fill(0);
      const range = max - min;
      for (let j = start; j <= i; j++) {
        const idx = Math.min(binCount - 1, Math.floor((signal[j] - min) / range * binCount));
        hist[idx]++;
      }
      const len = i - start + 1;
      let entropy = 0;
      for (const count of hist) {
        if (!count) continue;
        const p = count / len;
        entropy -= p * Math.log2(p);
      }
      return entropy;
    });
  },

  causalSquareWaveMetrics(signal, windowSize, thresholdMode, manualThreshold, minEdges) {
    const score = [], period = [], duty = [], jitterOut = [];
    const size = Math.max(2, Math.floor(windowSize || 2));
    const requiredEdges = Math.max(2, Math.floor(minEdges || 2));
    const mean = values => values.reduce((sum, v) => sum + v, 0) / values.length;
    const stddev = values => {
      const avg = mean(values);
      return Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length);
    };
    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - size + 1);
      let min = Infinity, max = -Infinity;
      for (let j = start; j <= i; j++) {
        const v = signal[j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const threshold = thresholdMode === '手动' ? manualThreshold : (min + max) / 2;
      if (min === max) {
        score.push(0); period.push(0); duty.push(0); jitterOut.push(1);
        continue;
      }
      const edges = [];
      let prev = signal[start] >= threshold ? 1 : 0;
      for (let j = start + 1; j <= i; j++) {
        const state = signal[j] >= threshold ? 1 : 0;
        if (state !== prev) edges.push({ index: j, type: state === 1 ? 'rise' : 'fall' });
        prev = state;
      }
      if (edges.length < requiredEdges) {
        score.push(0); period.push(0); duty.push(0); jitterOut.push(1);
        continue;
      }
      const cycles = [];
      for (let e = 0; e < edges.length; e++) {
        if (edges[e].type !== 'rise') continue;
        const nextRise = edges.slice(e + 1).find(edge => edge.type === 'rise');
        if (!nextRise) continue;
        const fall = edges.slice(e + 1).find(edge => edge.type === 'fall' && edge.index < nextRise.index);
        if (!fall) continue;
        const p = nextRise.index - edges[e].index;
        if (p > 0) cycles.push({ period: p, duty: (fall.index - edges[e].index) / p });
      }
      if (cycles.length < 2) {
        score.push(0); period.push(0); duty.push(0); jitterOut.push(1);
        continue;
      }
      const periods = cycles.map(c => c.period);
      const duties = cycles.map(c => c.duty);
      const periodMean = mean(periods);
      const dutyMean = mean(duties);
      const periodStd = stddev(periods);
      const dutyStd = stddev(duties);
      const jitterValue = periodMean === 0 ? 1 : periodStd / periodMean;
      const jitter = periodMean === 0 ? 1 : periodStd / periodMean;
      const regularity = 1 / (1 + jitter * 5);
      const dutyStability = 1 / (1 + dutyStd * 10);
      const scoreValue = Math.max(0, Math.min(1, regularity * dutyStability));
      score.push(scoreValue);
      period.push(periodMean);
      duty.push(dutyMean);
      jitterOut.push(jitterValue);
    }
    return { score, period, duty, jitter: jitterOut };
  },

  dcOffset(signal) {
    if (!signal.length) return [];
    const mean = signal.reduce((sum, v) => sum + v, 0) / signal.length;
    return signal.map(v => v - mean);
  },

  differentiator(signal) {
    if (!signal.length) return [];
    const out = [0];
    for (let i = 1; i < signal.length; i++) out.push(signal[i] - signal[i - 1]);
    return out;
  },

  slidingStdDev(signal, size) {
    if (!signal.length) return [];
    const half = Math.floor(size / 2);
    const out = [];
    for (let i = 0; i < signal.length; i++) {
      let sum = 0, sumSq = 0, cnt = 0;
      for (let j = i - half; j <= i + half; j++) {
        if (j >= 0 && j < signal.length) { const v = signal[j]; sum += v; sumSq += v * v; cnt++; }
      }
      const mean = cnt ? sum / cnt : 0;
      out.push(cnt > 1 ? Math.sqrt(Math.max(0, sumSq / cnt - mean * mean)) : 0);
    }
    return out;
  },

  intervalToBpm(intervals, sampleRate) {
    if (!intervals.length) return [];
    const sr = Number(sampleRate) || 0;
    const out = [];
    let held = 0;
    for (const raw of intervals) {
      const v = Number(raw);
      if (sr > 0 && Number.isFinite(v) && v > 0) {
        held = 60 * sr / v;
      } else if (v === 0) {
        held = 0;
      }
      // v < 0 or NaN: keep previous held value
      out.push(held);
    }
    return out;
  },

  peakValleyDetector(signal, trigger) {
    const n = signal.length;
    const empty = { out:[], out2:[], out3:[], out4:[], out5:[], out6:[], out7:[], out8:[], out9:[], out10:[] };
    if (!n) return empty;
    const trig = trigger || [];
    const peakPulse = new Array(n).fill(0);
    const valleyPulse = new Array(n).fill(0);
    const peakToPeak = new Array(n).fill(0);
    const valleyToValley = new Array(n).fill(0);
    const trigPeakInterval = new Array(n).fill(0);
    const trigValInterval = new Array(n).fill(0);
    const detectedPeakToPeak = [];
    const detectedValleyToValley = [];
    const detectedTrigPeaks = [];
    const detectedTrigVals = [];
    const EPS = 1e-12;
    let prevTrig = Number.isFinite(Number(trig[0])) ? Number(trig[0]) : 0;
    let segment = null;
    let lastPeakIdx = -1, lastValleyIdx = -1, lastRiseIdx = -1, lastFallIdx = -1;
    for (let i = 1; i < n; i++) {
      const rawTrig = Number(trig[i]);
      const curTrig = Number.isFinite(rawTrig) ? rawTrig : prevTrig;
      const edge = Math.abs(curTrig - prevTrig) > EPS;
      if (edge) {
        const isRising = curTrig > prevTrig;
        if (segment) {
          const idx = segment.index;
          if (segment.type === 'peak') {
            peakPulse[idx] = 1;
            if (lastPeakIdx >= 0) { const interval = idx - lastPeakIdx; peakToPeak[idx] = interval; detectedPeakToPeak.push(interval); }
            lastPeakIdx = idx;
          } else {
            valleyPulse[idx] = -1;
            if (lastValleyIdx >= 0) { const interval = idx - lastValleyIdx; valleyToValley[idx] = interval; detectedValleyToValley.push(interval); }
            lastValleyIdx = idx;
          }
        }
        if (isRising) {
          if (lastRiseIdx >= 0) { const interval = i - lastRiseIdx; trigPeakInterval[i] = interval; detectedTrigPeaks.push(interval); }
          lastRiseIdx = i;
        } else {
          if (lastFallIdx >= 0) { const interval = i - lastFallIdx; trigValInterval[i] = interval; detectedTrigVals.push(interval); }
          lastFallIdx = i;
        }
        const bandVal = Number.isFinite(Number(signal[i])) ? Number(signal[i]) : 0;
        segment = { type: isRising ? 'peak' : 'valley', index: i, value: bandVal };
        prevTrig = curTrig;
      } else if (segment) {
        const bandVal = Number.isFinite(Number(signal[i])) ? Number(signal[i]) : 0;
        const isBetterPeak = segment.type === 'peak' && bandVal > segment.value;
        const isBetterValley = segment.type === 'valley' && bandVal < segment.value;
        if (isBetterPeak || isBetterValley) { segment.index = i; segment.value = bandVal; }
      }
    }
    if (segment) {
      const idx = segment.index;
      if (segment.type === 'peak') {
        peakPulse[idx] = 1;
        if (lastPeakIdx >= 0) { const interval = idx - lastPeakIdx; peakToPeak[idx] = interval; detectedPeakToPeak.push(interval); }
      } else {
        valleyPulse[idx] = -1;
        if (lastValleyIdx >= 0) { const interval = idx - lastValleyIdx; valleyToValley[idx] = interval; detectedValleyToValley.push(interval); }
      }
    }
    let hp = 0, hv = 0, htp = 0, htv = 0;
    for (let i = 0; i < n; i++) {
      if (peakToPeak[i] !== 0) hp = peakToPeak[i]; else peakToPeak[i] = hp;
      if (valleyToValley[i] !== 0) hv = valleyToValley[i]; else valleyToValley[i] = hv;
      if (trigPeakInterval[i] !== 0) htp = trigPeakInterval[i]; else trigPeakInterval[i] = htp;
      if (trigValInterval[i] !== 0) htv = trigValInterval[i]; else trigValInterval[i] = htv;
    }
    return {
      out: peakPulse, out2: valleyPulse, out3: peakToPeak, out4: valleyToValley,
      out5: detectedPeakToPeak, out6: detectedValleyToValley,
      out7: trigPeakInterval, out8: detectedTrigPeaks,
      out9: trigValInterval, out10: detectedTrigVals
    };
  }
};
