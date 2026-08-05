import { Hammer } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { paths } from './paths';

/**
 * Placeholder for routes present in the navigation but not yet designed
 * (Destinations, About Us, Support). Keeps every header link functional.
 */
export const ComingSoonPage = ({ title = 'Coming soon' }) => (
  <EmptyState
    className="min-h-[60vh]"
    icon={<Hammer className="size-6 text-brand-600" aria-hidden="true" />}
    title={title}
    description="This section is being built. In the meantime, explore our current collection of residences."
    action={<Button to={paths.properties}>Browse properties</Button>}
  />
);
