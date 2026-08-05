import { cn } from '@/utils/classNames';

/** Centred step heading + body, matching the booking screens in the designs. */
export const StepShell = ({ title, subtitle, children, className, width = 'max-w-2xl' }) => (
  <div className="animate-fade-up">
    <header className="text-center">
      <h1 className="font-display text-[24px] font-bold text-brand-700 sm:text-[28px]">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[13px] text-ink-muted">{subtitle}</p>}
    </header>

    <div className={cn('mx-auto mt-8', width, className)}>{children}</div>
  </div>
);

/** Primary + cancel action pair, stacked and centred on every step. */
export const StepActions = ({ children, className }) => (
  <div className={cn('mx-auto mt-8 flex w-full max-w-xs flex-col gap-2.5', className)}>{children}</div>
);
