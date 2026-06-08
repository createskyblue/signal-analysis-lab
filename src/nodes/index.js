// ============================================================
//  Node Registry — imports all official nodes
// ============================================================
import * as input from './input.js';
import * as signalgen from './signalgen.js';
import * as csvoutput from './csvoutput.js';
import * as probe from './probe.js';
import * as lowpass from './lowpass.js';
import * as highpass from './highpass.js';
import * as bandpass from './bandpass.js';
import * as weighted from './weighted.js';
import * as firlinear from './firlinear.js';
import * as madfilter from './madfilter.js';
import * as kalman from './kalman.js';
import * as fft from './fft.js';
import * as custom from './custom.js';
import * as note from './note.js';
import * as splitter from './splitter.js';
import * as _switch from './switch.js';
import * as multiplexer from './multiplexer.js';
import * as weightedmixer from './weightedmixer.js';
import * as argselector from './argselector.js';
import * as cutbeg from './cutbeg.js';
import * as cutend from './cutend.js';
import * as cutrange from './cutrange.js';
import * as keeprange from './keeprange.js';
import * as avgwin from './avgwin.js';
import * as avgpool from './avgpool.js';
import * as maxpool from './maxpool.js';
import * as limiter from './limiter.js';
import * as multiplier from './multiplier.js';
import * as adder from './adder.js';
import * as subtractor from './subtractor.js';
import * as inverter from './inverter.js';
import * as normalizer from './normalizer.js';
import * as phaseshifter from './phaseshifter.js';
import * as logmultiplier from './logmultiplier.js';
import * as entropy from './entropy.js';
import * as squarewave from './squarewave.js';
import * as _abs from './abs.js';
import * as hysteresis from './hysteresis.js';
import * as medianwin from './medianwin.js';
import * as maxwin from './maxwin.js';
import * as minwin from './minwin.js';
import * as extremewin from './extremewin.js';
import * as dcoffset from './dcoffset.js';
import * as differentiator from './differentiator.js';
import * as stdwin from './stdwin.js';
import * as interval2bpm from './interval2bpm.js';
import * as peakdetector from './peakdetector.js';

// Sidebar order by category
export const ALL_NODES = [
  input, signalgen, csvoutput, probe,
  lowpass, highpass, bandpass, weighted, firlinear, madfilter, kalman,
  fft,
  multiplier, adder, subtractor, inverter, _abs, logmultiplier, normalizer, limiter, phaseshifter, hysteresis, dcoffset, differentiator,
  peakdetector, interval2bpm, squarewave,
  avgwin, medianwin, maxwin, minwin, extremewin, entropy, stdwin,
  avgpool, maxpool,
  cutbeg, cutend, cutrange, keeprange,
  splitter, _switch, multiplexer, weightedmixer, argselector,
  custom, note
];

export const NODE_DEFS = {};
export const NODE_PROCESS = {};
for (const mod of ALL_NODES) {
  NODE_DEFS[mod.def.type] = mod.def;
  NODE_PROCESS[mod.def.type] = mod.process;
}

export const state = { nodeIdCounter: 0 };
