/// <reference lib="webworker" />
import { runMonteCarlo } from '@/engine/monteCarlo';

self.onmessage = (e: MessageEvent) => {
  const { rainMm, durationH, totalPumps, totalCrews, draws, seed, hotspotsList } =
    e.data;

  try {
    const result = runMonteCarlo(
      rainMm,
      durationH,
      totalPumps,
      totalCrews,
      draws,
      seed,
      (progress) => {
        self.postMessage({ type: 'progress', progress });
      },
      hotspotsList
    );

    self.postMessage({ type: 'result', data: result });
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err?.message || String(err) });
  }
};
