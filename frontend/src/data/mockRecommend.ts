/**
 * MOCK DATA — recommend API fixture
 *
 * Used until POST /api/recommend is live.
 * This label appears in code only, NOT in the UI.
 */

import type { RecommendResult } from '@/types';

export const MOCK_RECOMMEND_RESULT: RecommendResult = {
  closureHoursSaved: 6.4,
  closureHoursSavedRange: [5.1, 7.6],
  vehiclesAvoided: 0,
  impactIndexReduced: 83,
  impactIndexReducedRange: undefined,
  allocations: [
    {
      hotspotId: 'delhi-minto-bridge',
      hotspotName: 'Minto Bridge',
      pumps: 2,
      crews: 1,
      drainCleared: true,
    },
    {
      hotspotId: 'delhi-pul-prahladpur',
      hotspotName: 'Pul Prahladpur',
      pumps: 1,
      crews: 1,
      drainCleared: true,
    },
  ],
  rationale: 'Same top-3 allocation in 86% of 200 simulations.',
};
