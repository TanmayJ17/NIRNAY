/**
 * Prints every hotspot state at 100 mm over 4 h (no interventions).
 * Run: npm run print:scenario
 */
import { ALERT_DEPTH_M, CLOSURE_DEPTH_M } from '@/config';
import { hotspots, warnIllustrativeHotspotData } from '@/data/loadHotspots';
import { simulate } from '@/engine/simulator';
import type { Interventions } from '@/types';

warnIllustrativeHotspotData();

const NONE: Interventions = {
  tempPumps: 0,
  drainCleared: false,
  preDivert: false,
  roadClosed: false,
};

const counts = { CLEAR: 0, ALERT: 0, CLOSED: 0 };

console.log('NIRNAY default scenario: 100 mm over 4 h, no interventions\n');

for (const hotspot of hotspots) {
  const result = simulate(hotspot, 100, 4, NONE);
  let status: keyof typeof counts = 'CLEAR';
  if (result.maxDepthM >= CLOSURE_DEPTH_M) status = 'CLOSED';
  else if (result.maxDepthM >= ALERT_DEPTH_M) status = 'ALERT';
  counts[status] += 1;

  console.log(
    [
      hotspot.id.padEnd(28),
      status.padEnd(7),
      `hmax=${result.maxDepthM.toFixed(3)} m`,
      `alert=${result.minutesToAlert ?? 'null'}`,
      `close=${result.minutesToClosure ?? 'null'}`,
      `closureMin=${result.closureMinutes}`,
      `impact=${result.impactIndex.toFixed(1)}`,
    ].join('  ')
  );
}

console.log(
  `\ncounts  CLEAR=${counts.CLEAR}  ALERT=${counts.ALERT}  CLOSED=${counts.CLOSED}  total=${hotspots.length}`
);
