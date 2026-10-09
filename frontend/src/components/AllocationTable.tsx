import React from 'react';
import type { AllocationEntry } from '@/types';

interface AllocationTableProps {
  allocations: AllocationEntry[];
  onSelectHotspot?: (hotspotId: string) => void;
}

export const AllocationTable: React.FC<AllocationTableProps> = ({
  allocations,
  onSelectHotspot,
}) => {
  return (
    <div className="border border-border bg-white rounded-sm overflow-hidden mb-4">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-[#F9FAFB] border-b border-border text-text-muted font-medium">
          <tr>
            <th className="py-2 px-3 uppercase tracking-wider font-semibold">
              HOTSPOT
            </th>
            <th className="py-2 px-3 uppercase tracking-wider font-semibold">
              PUMPS
            </th>
            <th className="py-2 px-3 uppercase tracking-wider font-semibold text-right">
              DRAIN CLEARED
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {allocations.map((alloc) => {
            const pumpRateM3s = (alloc.pumps * 0.15).toFixed(2);
            return (
              <tr
                key={alloc.hotspotId}
                onClick={() => onSelectHotspot?.(alloc.hotspotId)}
                className="hover:bg-surface/80 transition-colors cursor-pointer"
              >
                <td className="py-2.5 px-3 font-medium text-text-primary">
                  {alloc.hotspotName}
                </td>
                <td className="py-2.5 px-3 text-text-secondary">
                  <span className="font-mono font-semibold text-text-primary">
                    {alloc.pumps}
                  </span>{' '}
                  {alloc.pumps === 1 ? 'pump' : 'pumps'}{' '}
                  <span className="text-text-muted font-mono text-[10px]">
                    ({pumpRateM3s} m³/s)
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {alloc.drainCleared ? (
                    <span className="text-status-green font-medium">
                      Yes{' '}
                      <span className="text-text-muted text-[10px] font-normal">
                        (Inlet grates)
                      </span>
                    </span>
                  ) : (
                    <span className="text-text-muted">No</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AllocationTable;
