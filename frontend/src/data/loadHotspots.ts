import raw from '@/data/hotspots.json';
import type { Hotspot } from '@/types';

const dataset = raw as {
  data_status?: string;
  hotspots: Hotspot[];
};

export const HOTSPOT_DATA_STATUS =
  dataset.data_status ??
  'ILLUSTRATIVE - replace with verified hotspots.json from Member 1';

export const hotspots: Hotspot[] = dataset.hotspots;

let warned = false;

export function warnIllustrativeHotspotData(): void {
  if (warned) return;
  warned = true;
  console.warn(HOTSPOT_DATA_STATUS);
}

warnIllustrativeHotspotData();
