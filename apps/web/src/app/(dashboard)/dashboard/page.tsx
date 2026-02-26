'use client';

import { PageHeader } from '@/app/_components/page-header';

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader breadcrumbs={[{ label: 'Dashboard' }]} />

      <main className="flex flex-1 flex-col gap-5 p-6">
        {/* Stat cards row */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-card aspect-video p-6" />
          ))}
        </div>

        {/* Main content area */}
        <div className="glass-card rounded-card min-h-64 flex-1 p-6" />
      </main>
    </div>
  );
}
