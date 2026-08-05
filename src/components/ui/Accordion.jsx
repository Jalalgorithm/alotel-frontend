import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/classNames';

/**
 * Single-open accordion backing the FAQ section of the property detail page.
 *
 * @param {{ items: Array<{ id: string, question: string, answer: string }> }} props
 */
export const Accordion = ({ items = [], className }) => {
  const [openId, setOpenId] = useState(null);

  return (
    <div className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${item.id}`}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-ink transition-colors hover:text-brand-700"
            >
              {item.question}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'size-4 shrink-0 text-brand-600 transition-transform duration-200',
                  isOpen && 'rotate-180',
                )}
              />
            </button>

            {isOpen && (
              <p id={`faq-panel-${item.id}`} className="animate-fade-up pb-4 pr-8 text-sm leading-6 text-ink-soft">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
