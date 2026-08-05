import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { paths } from './paths';

/** 404 fallback. */
export const NotFoundPage = () => (
  <EmptyState
    className="min-h-[70vh]"
    icon={<Compass className="size-6 text-brand-600" aria-hidden="true" />}
    title="This page has checked out"
    description="The page you are looking for doesn't exist or has been moved."
    action={
      <div className="flex gap-3">
        <Button to={paths.home}>Back to home</Button>
        <Button to={paths.properties} variant="secondary">
          Browse properties
        </Button>
      </div>
    }
  />
);
