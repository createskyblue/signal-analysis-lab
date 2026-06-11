// ============================================================
//  Shared utilities for node processing
// ============================================================

/** Median of an array (used by Hampel and medianwin) */
export function median(values) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function getSampleRate(params = {}, ctx = {}, fallback = 1000) {
  const paramSampleRate = Number(params.samplerate);
  if (paramSampleRate > 0) return paramSampleRate;
  const ctxSampleRate = Number(ctx.sampleRate);
  return ctxSampleRate > 0 ? ctxSampleRate : fallback;
}
