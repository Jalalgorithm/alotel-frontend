import { ClipboardCheck, Gem, Globe } from 'lucide-react';
import { valueProps } from '@/lib/mock/data';

const ICONS = { gem: Gem, 'clipboard-check': ClipboardCheck, globe: Globe };

/** Three-up trust band: Premium Hospitality / Compliance-First / Global Reach. */
export const ValueProps = () => (
  <section className="border-y border-line bg-surface">
    <div className="shell grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {valueProps.map((item) => {
        const Icon = ICONS[item.icon] ?? Gem;

        return (
          <div key={item.id} className="px-6 py-8 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-50">
              <Icon className="size-4 text-brand-600" aria-hidden="true" />
            </span>

            <h3 className="mt-4 font-display text-[16px] font-semibold">{item.title}</h3>
            <p className="mx-auto mt-2 max-w-[36ch] text-[12px] leading-5 text-ink-soft">{item.description}</p>
          </div>
        );
      })}
    </div>
  </section>
);
