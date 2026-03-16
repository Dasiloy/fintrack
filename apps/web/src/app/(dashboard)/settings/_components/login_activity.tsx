import { activityTypeLabel } from '@/utils/helpers';
import type { LoginActivity } from '@fintrack/database/types';
import { getTimeFromNow } from '@fintrack/utils/date';
import { maskIp } from '@fintrack/utils/format';

interface LoginActivityProps {
  loginActivity: LoginActivity;
}

export function LoginActivityItem({ loginActivity }: LoginActivityProps) {
  const isSuccess = loginActivity.status === 'SUCCESS';
  return (
    <div
      key={loginActivity.id}
      className="border-border-subtle flex items-center gap-4 border-b px-4 py-3 last:border-0"
    >
      <span
        className={`size-2 shrink-0 rounded-full ${
          isSuccess
            ? 'bg-success shadow-[0_0_6px_rgba(74,222,128,0.5)]'
            : 'bg-error shadow-[0_0_6px_rgba(248,113,113,0.5)]'
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-text-primary text-xs font-medium capitalize">
          {isSuccess ? 'Success' : 'Failed'}
        </p>
        <p className="text-text-disabled font-mono text-[11px]">
          {maskIp(loginActivity.ipAddress)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-text-secondary text-xs">{activityTypeLabel(loginActivity.type)}</p>
        <p className="text-text-disabled text-[11px]">{getTimeFromNow(loginActivity.createdAt)}</p>
      </div>
    </div>
  );
}
