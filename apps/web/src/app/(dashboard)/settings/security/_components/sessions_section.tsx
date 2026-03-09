'use client';

import { Laptop, Monitor, Smartphone } from 'lucide-react';

import { Badge, Button } from '@ui/components';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Session {
  id: string;
  deviceName: string;
  browser: string;
  location: string;
  isCurrent: boolean;
  lastSeen?: string;
  Icon: typeof Monitor;
}

// ---------------------------------------------------------------------------
// Static placeholder — replace with real data from API when available
// ---------------------------------------------------------------------------

const PLACEHOLDER_SESSIONS: Session[] = [
  {
    id: '1',
    deviceName: 'MacBook Pro',
    browser: 'Chrome',
    location: 'San Francisco, US',
    isCurrent: true,
    Icon: Laptop,
  },
  {
    id: '2',
    deviceName: 'iPhone 15 Pro',
    browser: 'Safari',
    location: 'London, UK',
    isCurrent: false,
    lastSeen: '4h ago',
    Icon: Smartphone,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionsSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Active sessions card */}
      <div className="border-border-subtle bg-bg-elevated rounded-card border p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
              <Monitor className="text-primary size-4" />
            </div>
            <div>
              <p className="text-text-primary text-sm font-medium">Active Sessions</p>
              <p className="text-text-tertiary text-xs">Devices logged into your account</p>
            </div>
          </div>
          {/* TODO: wire up "end all" API call */}
          <Button variant="ghost" size="sm" className="text-error text-xs">
            End All
          </Button>
        </div>

        <ul className="space-y-2">
          {PLACEHOLDER_SESSIONS.map(({ id, deviceName, browser, location, isCurrent, lastSeen, Icon }) => (
            <li
              key={id}
              className={`flex items-center justify-between rounded-lg p-3 ${
                isCurrent
                  ? 'bg-primary/5 border-primary/15 border'
                  : 'bg-bg-surface-hover'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${
                    isCurrent ? 'bg-primary/10' : 'bg-bg-surface'
                  }`}
                >
                  <Icon className={`size-4 ${isCurrent ? 'text-primary' : 'text-text-tertiary'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-text-primary text-xs font-medium">{deviceName}</p>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-primary bg-primary/10 py-0 text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-text-disabled text-[11px]">
                    {browser} · {location}
                    {lastSeen && ` · ${lastSeen}`}
                  </p>
                </div>
              </div>
              {/* TODO: wire up individual session revoke */}
              {!isCurrent && (
                <Button variant="ghost" size="sm" className="text-text-disabled hover:text-error h-auto px-2 py-1 text-xs">
                  End
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Login history card */}
      <div className="border-border-subtle bg-bg-elevated rounded-card border p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
            <Monitor className="text-primary size-4" />
          </div>
          <div>
            <p className="text-text-primary text-sm font-medium">Login History</p>
            <p className="text-text-tertiary text-xs">Recent sign-in activity</p>
          </div>
        </div>

        {/* Placeholder rows */}
        <div className="space-y-0 overflow-hidden rounded-lg border border-white/5">
          {[
            { status: 'success', ip: '192.168.1.1', method: '2FA Authenticator', time: 'Today, 09:42 AM' },
            { status: 'failed', ip: '45.22.110.12', method: 'Password', time: 'Yesterday, 11:15 PM' },
          ].map((row, i) => (
            <div
              key={i}
              className="border-border-subtle flex items-center gap-4 border-b px-4 py-3 last:border-0"
            >
              <span
                className={`size-2 shrink-0 rounded-full ${
                  row.status === 'success' ? 'bg-success shadow-[0_0_6px_rgba(74,222,128,0.5)]' : 'bg-error shadow-[0_0_6px_rgba(248,113,113,0.5)]'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-text-primary text-xs font-medium capitalize">{row.status}</p>
                <p className="text-text-disabled font-mono text-[11px]">{row.ip}</p>
              </div>
              <div className="text-right">
                <p className="text-text-secondary text-xs">{row.method}</p>
                <p className="text-text-disabled text-[11px]">{row.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
