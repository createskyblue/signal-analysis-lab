English | [中文](README.md)

# Signal Analysis Lab

A browser-based visual signal processing tool. Build signal processing pipelines by dragging nodes and connecting wires.

![Screenshot](img/PixPin_2026-06-07_18-32-20.jpg)

## Features

### Node Types

| Category | Node | Description |
|----------|------|-------------|
| **Input & Output** | CSV Input | Import CSV files as signal source with configurable sample rate; double-click title to rename |
| | Signal Generator | Generates sine wave with configurable frequency, high/low levels, and output length; follows reference signal length when connected |
| | CSV Output | Manually export input signal as clean CSV; no headers, one sample per line; filename derived from node name |
| | Oscilloscope | Outputs waveform to the chart panel (color configurable); disable "Enabled" to hide from charts; double-click title to rename |
| **Filters** | Lowpass | RC lowpass filter with configurable order (1–8); higher orders give steeper roll-off (6dB/oct per stage) |
| | Highpass | RC highpass filter with configurable order (1–8) |
| | Bandpass | Cascaded lowpass + highpass with configurable order; ⚠ cutoff frequencies should differ by at least 2–3× |
| | Exponential Avg | EMA / 1st-order IIR, `y[i]=α·x[i]+(1-α)·y[i-1]`, configurable smoothing α |
| | FIR Linear Phase | Hamming-windowed sinc lowpass FIR; configurable cutoff frequency and odd tap count |
| | Hampel Filter | Hampel/MAD outlier filter; outputs filtered result and local MAD for threshold tuning |
| | Kalman Filter | Recursive estimator with parameters Q (process noise) and R (measurement noise) |
| **Frequency Domain** | FFT Spectrum | Outputs single-sided magnitude spectrum; configurable min/max display frequency; oscilloscope shows X-axis in Hz |
| **Operations & Transform** | Multiplier | A × B (dual-input, uses preset value when B is disconnected) |
| | Weighted Mixer | Multi-input point-wise weighted sum, input count and weights configurable |
| | Adder | A + B (dual-input, uses preset value when B is disconnected) |
| | Subtractor | A − B (dual-input, uses preset value when B is disconnected) |
| | Inverter | Signal × −1 |
| | Absolute Value | out = \|x\| |
| | Log Multiplier | out = x·log(1+\|x\|)/log(1+max), amplifies large values |
| | Normalizer | Maps to [−1, 1]; supports global (entire buffer) or windowed normalization |
| | Limiter | Clamps to [min, max] range |
| | Phase Shifter | Shifts signal left/right by N samples |
| | Hysteresis Comparator | Dual-input (A signal, B threshold) with hysteresis debouncing |
| | DC Offset Remover | `y[i]=x[i]−mean(x)`, removes DC component so waveform oscillates around zero |
| | Differentiator | `y[i]=x[i]−x[i−1]`, first-order difference computing point-wise rate of change |
| **Window Statistics** | Avg Win | Sliding window average (smoothing / denoising) |
| | Median Win | Sliding window median, suppresses isolated spikes |
| | Max Win | Sliding window maximum |
| | Min Win | Sliding window minimum |
| | Extreme Win | Outputs difference between window max and min |
| | Causal Window Entropy | Sliding window Shannon entropy (bits) over past N points with configurable bins |
| | Square Wave Detector | Detects edge regularity in causal windows; outputs regularity, period, duty cycle, and jitter |
| | Sliding Std Dev | Standard deviation within sliding window, measuring local fluctuation intensity |
| **Feature Extraction** | Peak/Valley Detector | Trigger-driven segmented extremum search; 2 inputs (signal + trigger), up to 10 outputs; checkbox-controlled output port visibility; best paired with hysteresis comparator |
| | Interval→BPM | `BPM=60×sampleRate/intervalSamples`; outputs 0 on zero input, holds last valid value on negative/NaN |
| **Downsampling** | Avg Pool | Average pooling downsampling (preserves trends) |
| | Max Pool | Max pooling downsampling (preserves peaks) |
| **Trim & Cut** | Cut Beg | Trims the first N% of data |
| | Cut End | Trims the last N% of data |
| | Cut Range | Trims data within a specified range |
| | Keep Range | Keeps only data within a specified range |
| **Flow Control** | Splitter | Splits 1 signal into configurable N identical copies (default 2) |
| | Switch | 1–12 configurable input/output port pairs; passes through when on, blocks all outputs and marks downstream connections red when off |
| | Multiplexer | Configurable port count; supports many-to-one (select one input) or one-to-many (select one output); prev/next/random quick switching; chart shows only the selected input channel |
| | Arg Selector | Each group has signal + compare inputs; point-wise comparison across groups, outputs the signal from the group with max/min compare value; optional fallback output when compare value exceeds threshold |
| **Utilities** | Custom Node | Write JS code to process signals; 1–12 configurable input/output ports with custom names |
| | Note | Text note node with no ports, saved together with the project |

### Interactions

- **Add nodes**: Drag from the left sidebar onto the canvas
- **Connect**: Drag from an output port (right dot) to an input port (left dot)
- **Delete connections**: Click a connection to mark it red, click again to delete; or right-click to delete directly
- **Delete nodes**: Select a node and press `Delete`
- **Box-select**: Left-drag on empty canvas to select multiple nodes
- **Append to selection**: Hold `Ctrl` and click node titles to add or remove from selection
- **Move multi-selection**: After box-selecting, drag any selected node's title bar to move the entire group
- **Rename nodes**: Double-click node title bar for inline editing, works for all node types
- **Copy/paste**: `Ctrl+C` / `Ctrl+V`; pasted nodes appear at the mouse position on canvas
- **Undo/redo**: `Ctrl+Z` / `Ctrl+Y`
- **Pan canvas**: Middle-mouse drag
- **Reset view**: Spacebar
- **Run**: `F5` or click the Run button
- **CSV export**: CSV Output nodes can export individually via "Export CSV" button; enable "Auto Export" in the top-right corner for automatic export on each run (only CSV outputs with "Allow Auto Export" checked); output has no headers, one sample per line, metadata embedded in filename
- **Custom nodes**: Legacy `return signal.map(...)` still works for single-input/single-output; for multi-input, read `inputs.in`, `inputs.in2`, etc.; for multi-output, return `{ out: arr1, out2: arr2 }`
- **Copy context**: Click "📋 Copy Context" to copy the current project graph (without signal data) and custom node API reference to clipboard, ready to paste into external AI tools for analysis and custom node coding
- **Normalization modes**: Normalizer supports "Global" (entire input buffer) or "Windowed" (sliding window) mode; window size input is only enabled in windowed mode
- **Chart zoom**: Mouse wheel; each chart has its own X-axis cursor readout — sample index for waveforms, frequency in Hz for FFT
- **Chart visibility**: Oscilloscope "Enabled" toggle controls whether it appears in charts; click chart title or button to toggle show/hide, title remains visible when hidden
- **Chart navigation**: Click a chart to center its corresponding oscilloscope node on the canvas with a 0.5s crosshair overlay
- **Chart reorder**: Drag chart titles to reorder vertically
- **Language**: Click the EN/中 button in the top-right to switch between Chinese and English

### Other Features

- Auto-save project to browser local storage
- Import/export JSON project files
- Scheduled auto-run with configurable interval
- Per-chart cursor readout
- Undo/redo (up to 50 steps)

## Usage

```bash
npm install
npm run dev      # Development mode at http://localhost:3000
npm run build    # Production build to dist/
```

## Quick Start

Live demo: https://createskyblue.github.io/signal-analysis-lab/

Click the "📊 Demo Data" button in the sidebar to load a pre-built noisy sine wave test pipeline.
