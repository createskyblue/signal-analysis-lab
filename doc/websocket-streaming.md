# WebSocket Streaming Guide

How to stream real-time sensor data from an ESP32 (or any WebSocket source) into the Signal Analysis Lab.

## Architecture

```
┌──────────────┐      ┌─────────────────────┐      ┌──────────┐
│  Start Node   │─────▶│  Custom Node         │─────▶│  Probe   │
│  (trigger)    │      │  (WebSocket client)  │      │  (chart) │
└──────────────┘      └─────────────────────┘      └──────────┘
```

1. **Start Node** — the execution entry point. When enabled, it triggers downstream nodes. Unchecking its **Enabled** checkbox skips the entire WebSocket chain without deleting anything.
2. **Custom Node** — contains the JavaScript that opens a WebSocket, receives data, and returns it as arrays.
3. **Probe** — plots the result on the chart panel.

The engine runs nodes in **BFS topological order** from valid sources (`input`, `signalgen`, `start`). Nodes not reachable from an enabled source are never executed.

## Quick Start

1. Drag a **Start Node** (green, under "Input & Output") onto the canvas.
2. Drag a **Custom Node** onto the canvas. Set **Output Port Count** to `2`.
3. Connect: `Start.out → Custom.in`.
4. Paste the WebSocket receiver script into the Custom Node's **JS Algorithm** editor (see template below).
5. Change `ESP32_IP` to your device's actual address.
6. Attach a **Probe** to `out` (channel 0) and optionally another to `out2` (channel 1).
7. Press **F5** to run.

## Template: 15-second ESP32 ADC Receiver

This connects to an ESP32-S3 running the heart-rate firmware, receives 15 seconds of raw ADC samples at 500 Hz per channel, deinterleaves the two channels, and returns them.

The firmware exposes a binary WebSocket at `ws://<ip>/adc/raw`. Each frame:

| Offset | Size | Field | Type |
|--------|------|-------|------|
| 0 | 4 | Magic `0x48524144` ("HRAD") | uint32 LE |
| 4 | 1 | Version (=1) | uint8 |
| 5 | 1 | Frame type (=1, RAW_ADC) | uint8 |
| 6 | 4 | Sequence number | uint32 LE |
| 10 | 4 | Sample rate (Hz) | uint32 LE |
| 14 | 1 | Channel count | uint8 |
| 15 | 1 | Reserved | uint8 |
| 16 | 4 | Channel mask | uint32 LE |
| 20 | 4 | Body length (bytes) | uint32 LE |
| 24 | *n* | Body — interleaved `uint16 LE` samples | uint16[] |
| 24+*n* | 4 | CRC32 (IEEE 802.3) — **ignored by receiver** | uint32 LE |

Total ADC rate is 1000 Hz (2 channels × 500 Hz). Samples are interleaved: `ch0_s0, ch1_s0, ch0_s1, ch1_s1, …`. Each frame carries up to 256 samples.

### Receiver Script

Copy the entire script below into the Custom Node's **JS Algorithm** editor, then adjust `ESP32_IP`:

```js
// ============================================================
//  ESP32 ADC 实时接收 — WebSocket 自定义节点脚本（15 秒版）
//  Paste this into: Custom Node → JS Algorithm
//
//  Behavior: connect ws://<IP>/adc/raw → collect 15s → return 2 channels
// ============================================================

const ESP32_IP        = '192.168.4.1';  // ← change to your ESP32 IP
const ESP32_PORT      = 80;
const WS_URI          = '/adc/raw';
const COLLECT_SECONDS = 15;
const CONNECT_TIMEOUT = 5000;

async function main() {
  const url = `ws://${ESP32_IP}:${ESP32_PORT}${WS_URI}`;
  console.log(`[ESP32 ADC] connecting ${url}, collecting ${COLLECT_SECONDS}s ...`);

  const ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';

  const allSamples   = [];
  let sampleRate     = 500;
  let channelCount   = 2;
  let lastSeq        = -1;
  let seqGaps        = 0;
  let firstFrameTime = null;

  await new Promise((resolve, reject) => {
    const heartbeat = setInterval(() => {
      if (aborted()) { ws.close(); reject(new Error('ABORT')); }
    }, 200);

    let connTimer = setTimeout(() => {
      ws.close();
      reject(new Error(`Connection timeout (${CONNECT_TIMEOUT/1000}s)`));
    }, CONNECT_TIMEOUT);

    ws.onopen = () => console.log('[ESP32 ADC] connected');

    ws.onmessage = (event) => {
      if (aborted()) { ws.close(); reject(new Error('ABORT')); return; }

      const dv = new DataView(event.data);
      if (dv.byteLength < 28) return;

      const magic = dv.getUint32(0, true);
      if (magic !== 0x48524144) return;

      const sequence = dv.getUint32(6, true);
      sampleRate     = dv.getUint32(10, true);
      channelCount   = dv.getUint8(14) || 2;
      const bodyLen  = dv.getUint32(20, true);
      const n        = bodyLen / 2;

      if (firstFrameTime === null) {
        firstFrameTime = performance.now();
        clearTimeout(connTimer);
      }

      if (lastSeq >= 0 && sequence !== ((lastSeq + 1) & 0xFFFFFFFF)) seqGaps++;
      lastSeq = sequence;

      for (let i = 0; i < n; i++) allSamples.push(dv.getUint16(24 + i * 2, true));

      const elapsed = (performance.now() - firstFrameTime) / 1000;
      if (elapsed >= COLLECT_SECONDS) {
        console.log(`[ESP32 ADC] collected ${elapsed.toFixed(1)}s, done`);
        ws.close();
        resolve();
      }
    };

    ws.onerror = () => { clearInterval(heartbeat); reject(new Error('WebSocket error')); };
    ws.onclose = (e) => { clearInterval(heartbeat); resolve(); };
  });

  if (!allSamples.length) throw new Error('No data received');

  // Deinterleave: ch0_s0, ch1_s0, ch0_s1, ch1_s1, ...
  const ch0 = [], ch1 = [];
  for (let i = 0; i < allSamples.length; i++) {
    if (i % 2 === 0) ch0.push(allSamples[i]);
    else             ch1.push(allSamples[i]);
  }

  const dur = allSamples.length / (sampleRate * channelCount);
  console.log(`[ESP32 ADC] done: ${allSamples.length} pts, ${dur.toFixed(1)}s, ch0 ${ch0.length}, ch1 ${ch1.length}`);
  if (seqGaps) console.warn(`[ESP32 ADC] ${seqGaps} sequence gaps`);

  return { out: ch0, out2: ch1 };
}

try {
  return await main();
} catch (err) {
  if (err?.message === 'ABORT' || err?.name === 'AbortError') {
    console.log('[ESP32 ADC] cancelled');
    return { out: [], out2: [] };
  }
  throw err;
}
```

After 15 seconds the receiver closes the WebSocket and returns:

```js
{ out: ch0_array, out2: ch1_array }
// ch0 = high-gain channel  (~7500 points at 500 Hz)
// ch1 = low-gain channel  (~7500 points at 500 Hz)
```

### Downstream Processing

Once data arrives, connect filters from the toolbox:

```
Start → Custom(WS) → Bandpass(0.67–2 Hz) → Normalizer → Probe "Heart Rate"
                   → Bandpass(0.17–0.6 Hz) → Normalizer → Probe "Respiration"
```

## Writing Your Own Receiver

The custom node script runs inside an `async` function. The engine **awaits** its return value before pushing data downstream.

Available globals:
- `signal` — the input array (from the Start Node: `[1]`)
- `sampleRate` — the sample rate set by the Start Node
- `sleep(ms)` — async pause, cancellable by ESC/F5
- `aborted()` — returns `true` if the user cancelled execution

Return format:
- Single output → `return number[]`
- Multiple outputs → `return { out: number[], out2: number[], … }`

## Troubleshooting

| Symptom | Likely Cause |
|---------|-------------|
| "Please add an input…" toast | Start Node is disabled or missing. Check the **Enabled** checkbox. |
| WebSocket connection failed | ESP32 is off, wrong IP, or not on the same network. |
| Connection closed before data | ESP32 firmware is not pushing `/adc/raw` frames. |
| No data after 15 seconds | `COLLECT_SECONDS` may be too short, or frames are being dropped. |
| Wrong node name in progress bar | Fixed — make sure you're on the latest build. |

## Important: Run Locally, Not from GitHub Pages

**The live demo at `https://createskyblue.github.io/…` will NOT work with WebSocket streaming.**

Browsers enforce a strict mixed-content policy: an HTTPS page may only open **secure** WebSocket connections (`wss://`). An ESP32 (or any typical embedded device) serves plain `ws://` without TLS. The browser will refuse the connection with no clear error message.

### Solution

Clone the repository and run the dev server locally:

```bash
git clone https://github.com/createskyblue/signal-analysis-lab.git
cd signal-analysis-lab
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser. A plain HTTP page can open `ws://` connections to your ESP32 without any restrictions.

## Notes

- The browser must be on the same network as the ESP32 (or use the ESP32's AP mode at `192.168.4.1`).
- WebSocket in browsers does not support custom headers; authentication must be done at the application layer if needed.
- The CRC32 trailer on each frame is **not validated** — TCP and the WebSocket protocol already guarantee integrity.
