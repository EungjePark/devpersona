import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoadingCardProps {
  message?: string;
  className?: string;
}

export function LoadingCard({ message = 'Loading...', className }: LoadingCardProps) {
  return (
    <Card className={className}>
      <CardContent className="py-8 text-center">
        <div className="animate-pulse text-text-muted">{message}</div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateCardProps {
  message: string;
  subMessage?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyStateCard({ message, subMessage, action, className }: EmptyStateCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="py-12 text-center">
        <p className="text-text-muted mb-2">{message}</p>
        {subMessage && (
          <p className="text-sm text-text-muted">{subMessage}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
