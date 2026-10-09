import type { MonteCarloResult } from './monteCarlo';
import { runMonteCarlo } from './monteCarlo';
import type { Hotspot } from '@/types';

/**
 * Run Monte Carlo asynchronously using a Web Worker if available in browser,
 * or fall back to main thread execution in headless/Node test environments.
 */
export async function runMonteCarloAsync(
  rainMm: number,
  durationH: number,
  totalPumps: number,
  totalCrews: number,
  draws: number = 200,
  seed: number = 42,
  onProgress?: (progress: number) => void,
  hotspotsList?: Hotspot[]
): Promise<MonteCarloResult> {
  // Check if Web Worker is supported in environment
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
    return new Promise<MonteCarloResult>((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL('../workers/monteCarlo.worker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (e: MessageEvent) => {
          if (e.data.type === 'progress') {
            onProgress?.(e.data.progress);
          } else if (e.data.type === 'result') {
            worker.terminate();
            resolve(e.data.data);
          } else if (e.data.type === 'error') {
            worker.terminate();
            reject(new Error(e.data.error));
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          // Fallback to synchronous run if worker script fails to initialize
          try {
            const fallback = runMonteCarlo(
              rainMm,
              durationH,
              totalPumps,
              totalCrews,
              draws,
              seed,
              onProgress,
              hotspotsList
            );
            resolve(fallback);
          } catch (syncErr) {
            reject(syncErr);
          }
        };

        worker.postMessage({
          rainMm,
          durationH,
          totalPumps,
          totalCrews,
          draws,
          seed,
          hotspotsList,
        });
      } catch {
        // Fallback to direct execution
        resolve(
          runMonteCarlo(
            rainMm,
            durationH,
            totalPumps,
            totalCrews,
            draws,
            seed,
            onProgress,
            hotspotsList
          )
        );
      }
    });
  }

  // Headless / Node environment: execute directly
  return Promise.resolve(
    runMonteCarlo(
      rainMm,
      durationH,
      totalPumps,
      totalCrews,
      draws,
      seed,
      onProgress,
      hotspotsList
    )
  );
}
