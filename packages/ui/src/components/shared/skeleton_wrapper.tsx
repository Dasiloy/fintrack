import { Skeleton } from '@ui/components/atoms';

export const SkeletonWrapper = ({
  loading,
  children,
  className,
}: {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}) => {
  return loading ? <Skeleton className={className} /> : children;
};
