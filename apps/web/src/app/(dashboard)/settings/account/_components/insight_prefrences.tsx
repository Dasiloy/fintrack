'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, Sparkles, TriangleAlert } from 'lucide-react';
import { toast } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { ProfileSection } from '@/app/(dashboard)/settings/account/_components/profile_section';
import { SettingSwitch } from '@/app/(dashboard)/settings/account/_components/setting_switch';

export function InsightPrefrences() {
  const getMe = api_client.user.getMe.useQuery();

  const [insights, setInsights] = useState({
    dailyInsightsEnabled: false,
    budgetInsightsEnabled: false,
  });

  useEffect(() => {
    const setting = getMe.data?.data?.setting;
    if (setting) {
      setInsights({
        dailyInsightsEnabled: setting.dailyInsightsEnabled,
        budgetInsightsEnabled: setting.budgetInsightsEnabled,
      });
    }
  }, [getMe.data]);

  const utils = api_client.useUtils();
  const updateSettings = api_client.user.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Insight preferences updated');
      utils.user.getMe.invalidate();
    },
    onError: () => toast.error('Failed to update insight preferences'),
  });

  const onSave = () => {
    const setting = getMe.data?.data?.setting;
    if (!setting) return;

    // updateSettings expects the full NotificationSetting boolean payload —
    // carry the existing channel preferences through and override the insights.
    updateSettings.mutate({
      budgetAlertMail: setting.budgetAlertMail,
      budgetAlertApp: setting.budgetAlertApp,
      billReminderMail: setting.billReminderMail,
      billReminderApp: setting.billReminderApp,
      weeklyReportMail: setting.weeklyReportMail,
      weeklyReportApp: setting.weeklyReportApp,
      aiInsightsMail: setting.aiInsightsMail,
      aiInsightsApp: setting.aiInsightsApp,
      goalsAlertMail: setting.goalsAlertMail,
      goalsAlertApp: setting.goalsAlertApp,
      splitsAlertMail: setting.splitsAlertMail,
      splitsAlertApp: setting.splitsAlertApp,
      dailyInsightsEnabled: insights.dailyInsightsEnabled,
      budgetInsightsEnabled: insights.budgetInsightsEnabled,
    });
  };

  const disabled = !getMe.data?.data?.setting || updateSettings.isPending;

  return (
    <ProfileSection
      title="Insight Prefrences"
      onSave={onSave}
      saving={updateSettings.isPending}
      description="Control which AI insights run on your account"
      Icon={<BrainCircuit className="text-primary size-5" />}
    >
      <div className="grid grid-cols-1 gap-4">
        <SettingSwitch
          disabled={disabled}
          title={
            insights.dailyInsightsEnabled
              ? 'Daily AI Insights Enabled'
              : 'Daily AI Insights Disabled'
          }
          description={
            insights.dailyInsightsEnabled
              ? 'Daily AI insights are generated for you'
              : 'Daily insights will not run at the scheduled time'
          }
          Icon={<Sparkles />}
          checked={insights.dailyInsightsEnabled}
          onCheckedChange={(checked) =>
            setInsights((prev) => ({ ...prev, dailyInsightsEnabled: checked }))
          }
        />
        <SettingSwitch
          disabled={disabled}
          title={
            insights.budgetInsightsEnabled
              ? 'Budget Breach Insights Enabled'
              : 'Budget Breach Insights Disabled'
          }
          description={
            insights.budgetInsightsEnabled
              ? 'Budget breaches are caught and AI insights are generated'
              : 'Budget breaches are ignored and no insights are generated'
          }
          Icon={<TriangleAlert />}
          checked={insights.budgetInsightsEnabled}
          onCheckedChange={(checked) =>
            setInsights((prev) => ({ ...prev, budgetInsightsEnabled: checked }))
          }
        />
      </div>
    </ProfileSection>
  );
}
