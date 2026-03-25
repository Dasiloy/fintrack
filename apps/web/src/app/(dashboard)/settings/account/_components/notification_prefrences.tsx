'use client';

import { ProfileSection } from '@/app/(dashboard)/settings/account/_components/profile_section';
import type { NotificationSetting } from '@fintrack/database/types';
import { api_client } from '@/lib/trpc_app/api_client';
import { Checkbox, toast } from '@ui/components';
import { capitalize } from '@fintrack/utils/format';
import { useEffect, useState } from 'react';
import Image from 'next/image';

/**
 * Notification Types
 *  Should be in sync with the DB
 */
const NOTIFICATION_TYPES = [
  'budgetAlert',
  'billReminder',
  'weeklyReport',
  'aiInsights',
  'goalsAlert',
  'splitsAlert',
] as const;

/**
 *  Titles for the notification types
 *  Huiman readable titles for the notification types
 */
const TITLES: Record<(typeof NOTIFICATION_TYPES)[number], string> = {
  budgetAlert: 'Budget Alert',
  billReminder: 'Bill Reminder',
  weeklyReport: 'Weekly Report',
  aiInsights: 'AI Insights',
  goalsAlert: 'Goals Alert',
  splitsAlert: 'Splits Alert',
};

/**
 * Descriptions for the notification types
 *  Human readable descriptions for the notification types
 */
const DESCRIPTIONS: Record<(typeof NOTIFICATION_TYPES)[number], string> = {
  budgetAlert: 'Get notified when your budget is exceeded',
  billReminder: 'Get notified when your bills are due',
  weeklyReport: 'Get notified when your weekly report is ready',
  aiInsights: 'Get notified when your AI insights are ready',
  goalsAlert: 'Get notified when your goals are achieved',
  splitsAlert: 'Get notified when your splits are ready',
};

/**
 *
 * Group notifications by type and channel
 *  Mail and App are the channels
 *
 * @param  {Partial<NotificationSetting>} settings - The settings to group
 * @returns {Array<{
 *    type: (typeof NOTIFICATION_TYPES)[number],
 *    title: string,
 *    description: string,
 *    notifications: Array<{ type: 'mail' | 'app'; enabled: boolean }>
 * }>}
 */
function groupNotifications(settings?: Partial<NotificationSetting>) {
  const grouped: Record<
    (typeof NOTIFICATION_TYPES)[number],
    Array<{ type: 'mail' | 'app'; enabled: boolean }>
  > = {
    budgetAlert: [],
    billReminder: [],
    weeklyReport: [],
    aiInsights: [],
    goalsAlert: [],
    splitsAlert: [],
  };

  if (settings) {
    for (const key in settings) {
      // trim off Mail /App  suffix from key
      const type = key.replace(/Mail|App$/, '') as (typeof NOTIFICATION_TYPES)[number];

      if (NOTIFICATION_TYPES.includes(type)) {
        grouped[type].push({
          type: key.includes('Mail') ? 'mail' : 'app',
          enabled: Boolean(settings[key as keyof typeof settings]),
        });
      }
    }
  }

  return Object.entries(grouped).map(([type, notifications]) => ({
    type: type as (typeof NOTIFICATION_TYPES)[number],
    title: TITLES[type as (typeof NOTIFICATION_TYPES)[number]],
    description: DESCRIPTIONS[type as (typeof NOTIFICATION_TYPES)[number]],
    notifications,
  }));
}

// =================================================
//    MAIN COMPONENR
// =================================================
export function NotificationPrefrences() {
  const getMe = api_client.user.getMe.useQuery();

  // hooks
  const [grouped, setGrouped] = useState<ReturnType<typeof groupNotifications>>([]);

  //helpers
  const onEdit = (
    type: (typeof NOTIFICATION_TYPES)[number],
    channel: 'mail' | 'app',
    enabled: boolean,
  ) => {
    const map = new Map(grouped.map((group) => [group.type, group]));
    const group = map.get(type);
    if (group) {
      group.notifications = group.notifications.map((notification) =>
        notification.type === channel ? { ...notification, enabled } : notification,
      );
      map.set(type, group);
    }
    setGrouped(Array.from(map.values()));
  };

  // mutations
  const utils = api_client.useUtils();
  const updateNotificationSettings = api_client.user.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Notification settings updated');
      utils.user.getMe.invalidate();
    },
    onError: () => {
      toast.error('Failed to update notification settings');
    },
  });

  const onSave = () => {
    const data: Partial<NotificationSetting> = {};
    for (const group of grouped) {
      for (const notification of group.notifications) {
        const key = `${group.type}${capitalize(notification.type)}`;
        data[key as keyof Partial<NotificationSetting>] = notification.enabled as any;
      }
    }
    updateNotificationSettings.mutate(data as any);
  };

  useEffect(() => {
    if (getMe.data) {
      setGrouped(groupNotifications(getMe.data.data?.setting ?? {}));
    }
  }, [getMe.data]);

  return (
    <ProfileSection
      title="Notifications"
      onSave={onSave}
      saving={updateNotificationSettings.isPending}
      description="Manage your account notification preferences"
      Icon={<Image width={20} height={20} alt="Prefrences" src="/bell.svg" />}
    >
      <table className="border-border-subtle w-full overflow-hidden border">
        <thead className="bg-bg-surface">
          <tr className="text-text-secondary text-body-lg">
            <th className="px-4 py-4 text-left md:px-5">Notification Type</th>
            <th className="hidden w-[100px] min-w-0 overflow-hidden p-0 py-4 text-center whitespace-nowrap md:table-cell">
              Push
            </th>
            <th className="hidden w-[100px] min-w-0 overflow-hidden p-0 py-4 text-center whitespace-nowrap md:table-cell">
              Email
            </th>
          </tr>
        </thead>
        <tbody className="bg-transparent">
          {grouped.map(({ type, title, description, notifications }) => (
            <tr key={type} className="border-border-subtle border-b">
              <td className="px-4 py-4 text-left md:px-5">
                <div className="flex flex-col gap-0.5">
                  <p className="text-text-primary text-body font-medium">{title}</p>
                  <p className="text-text-tertiary text-body-sm font-normal">{description}</p>

                  {/** for mobile  view only */}
                  <div className="mt-3 flex flex-col gap-4 md:hidden">
                    {notifications.map(({ type: notificationType, enabled }) => (
                      <div className="flex items-center gap-2" key={notificationType}>
                        <Checkbox
                          checked={enabled}
                          onCheckedChange={(checked) => {
                            onEdit(type, notificationType, checked as boolean);
                          }}
                        />
                        <p className="text-text-primary text-body font-medium">
                          {capitalize(notificationType)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </td>
              {notifications.map(({ type: notificationType, enabled }) => (
                <td
                  className="hidden w-[100px] min-w-0 overflow-hidden p-0 py-4 text-center whitespace-nowrap md:table-cell"
                  key={notificationType}
                >
                  <Checkbox
                    checked={enabled}
                    onCheckedChange={(checked) => {
                      onEdit(type, notificationType, checked as boolean);
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ProfileSection>
  );
}
