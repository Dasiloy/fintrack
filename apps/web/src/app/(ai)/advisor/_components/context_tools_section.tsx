'use client';

// ── ContextToolsSection ───────────────────────────────────────────────────────
// Tool toggle section in the right context panel.
// Two groups: "Your Data" (Postgres — free, no rate limits) and
// "Market Data" (Oracle — external APIs with rate limits, opt-in by default).
// The comment above each group explains the distinction so future devs
// understand why oracle tools start disabled.

import * as React from 'react';
import { Database, Globe, ChevronDown } from 'lucide-react';
import { Switch } from '@ui/components';
import { cn } from '@ui/lib/utils';
import type { AdvisorTool } from '../_lib/advisor.types';

interface ContextToolsSectionProps {
  tools: AdvisorTool[];
  onToolToggle: (id: string) => void;
}

export function ContextToolsSection({ tools, onToolToggle }: ContextToolsSectionProps) {
  const [expanded, setExpanded] = React.useState(true);

  // Postgres tools are free — query the user's own Neon DB, no external calls.
  const postgresTools = tools.filter((t) => t.category === 'postgres');
  // Oracle tools call external APIs (rate-limited). Disabled by default so the
  // user opts in and understands the quota implications.
  const oracleTools = tools.filter((t) => t.category === 'oracle');

  return (
    <div className="border-b border-border-subtle">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-bg-surface-hover"
        aria-expanded={expanded}
      >
        <span className="flex-1 text-[12px] font-semibold text-text-primary">Tools</span>
        <ChevronDown
          className={cn(
            'size-3.5 text-text-tertiary transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          {/* Your Data group */}
          <ToolGroup
            icon={<Database className="size-3.5 text-text-tertiary" />}
            label="Your Data"
            tools={postgresTools}
            onToggle={onToolToggle}
          />

          {/* Market Data group */}
          <ToolGroup
            icon={<Globe className="size-3.5 text-warning" />}
            label="Market Data"
            sublabel="Rate limited"
            tools={oracleTools}
            onToggle={onToolToggle}
          />
        </div>
      )}
    </div>
  );
}

// ── ToolGroup ─────────────────────────────────────────────────────────────────

interface ToolGroupProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  tools: AdvisorTool[];
  onToggle: (id: string) => void;
}

function ToolGroup({ icon, label, sublabel, tools, onToggle }: ToolGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Group label */}
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
          {label}
        </span>
        {sublabel && (
          <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[9px] font-medium text-warning">
            {sublabel}
          </span>
        )}
      </div>

      {/* Tool rows */}
      {tools.map((tool) => (
        <ToolRow key={tool.id} tool={tool} onToggle={onToggle} />
      ))}
    </div>
  );
}

// ── ToolRow ───────────────────────────────────────────────────────────────────

function ToolRow({ tool, onToggle }: { tool: AdvisorTool; onToggle: (id: string) => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-bg-elevated px-3 py-2.5">
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="text-[12px] font-medium text-text-primary truncate">{tool.name}</span>
        <span className="text-[10px] text-text-disabled leading-snug">{tool.description}</span>
      </div>
      <Switch
        checked={tool.enabled}
        onCheckedChange={() => onToggle(tool.id)}
        aria-label={`Toggle ${tool.name}`}
        className="mt-0.5 shrink-0 cursor-pointer"
      />
    </div>
  );
}
