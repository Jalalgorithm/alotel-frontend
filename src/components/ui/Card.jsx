import { cn } from '@/utils/classNames';

/** Surface primitive: white panel, hairline border, soft elevation. */
export const Card = ({ as: Component = 'div', className, children, ...props }) => (
  <Component
    className={cn('rounded-card border border-line bg-surface shadow-card', className)}
    {...props}
  >
    {children}
  </Component>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('border-b border-line px-5 py-4', className)} {...props}>
    {children}
  </div>
);

export const CardBody = ({ className, children, ...props }) => (
  <div className={cn('px-5 py-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn('border-t border-line px-5 py-4', className)} {...props}>
    {children}
  </div>
);
