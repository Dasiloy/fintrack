import TwoFactorSection from './_components/two_factor_section';

export default function SecuritySettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-text-primary text-2xl font-semibold">Security</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Manage your account security and authentication settings.
        </p>
      </div>

      <TwoFactorSection />
    </div>
  );
}
