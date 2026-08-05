import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { propertyTypes as mockPropertyTypes } from '@/lib/mock/data';
import { PROPERTY_TYPE_FILTERS } from '@/lib/propertySchema';
import { env } from '@/lib/env';

/**
 * The API validates `property_type` against a closed list and 400s on anything
 * else, so the pills have to be the API's vocabulary when it is driving the
 * grid — and the mock's when it is.
 */
const propertyTypes = env.useMockProperties ? mockPropertyTypes : PROPERTY_TYPE_FILTERS;

/**
 * Category pills + result count + layout switch, matching the toolbar above
 * the "Our Properties" grid.
 */
export const PropertyFilters = ({ activeType, onTypeChange, total, layout, onLayoutChange }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    {/* `min-w-0` lets the pill rail shrink and scroll instead of pushing into
        the result count on tablet widths. */}
    <div
      className="scrollbar-none -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 py-1"
      role="tablist"
      aria-label="Property type"
    >
      {propertyTypes.map((type) => {
        const isActive = activeType === type;

        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTypeChange(type)}
            className={cn(
              'shrink-0 rounded-md border px-3.5 py-1.5 text-[12px] font-medium transition-colors',
              isActive
                ? 'border-brand-700 bg-brand-700 text-white'
                : 'border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700',
            )}
          >
            {type}
          </button>
        );
      })}
    </div>

    <div className="flex shrink-0 items-center gap-3">
      <p className="whitespace-nowrap text-[13px] font-semibold text-ink">
        {total.toLocaleString()} {total === 1 ? 'property' : 'properties'}
      </p>

      <div className="flex items-center gap-1">
        {[
          { id: 'grid', Icon: LayoutGrid, label: 'Grid view' },
          { id: 'list', Icon: List, label: 'List view' },
        ].map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={layout === id}
            onClick={() => onLayoutChange(id)}
            className={cn(
              'flex size-8 items-center justify-center rounded transition-colors sm:size-7',
              layout === id ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-black/5',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  </div>
);
