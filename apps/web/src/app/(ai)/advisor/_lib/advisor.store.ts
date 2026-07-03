// ── Advisor Jotai store ───────────────────────────────────────────────────────
// One coherent state layer for the advisor chat:
//
// - PERSISTED (atomWithStorage, localStorage, cross-tab):
//     • conversationHeadAtom  — the latest message page per conversation, used to
//       seed React Query so a reopen/reload paints instantly.
//     • conversationsListAtom — the sidebar list.
//   `getOnInit: true` so a synchronous read during render (React Query
//   `placeholderData`) hydrates from storage immediately instead of flashing null.
//
// - EPHEMERAL (plain atomFamily):
//     • conversationStreamAtom — THIS session's live/in-flight turns per
//       conversation. It lives outside the React tree, so a stream is NEVER cut by
//       navigation: switching the advisor/insights tab (which unmounts ChatPanel)
//       or switching conversations no longer aborts or loses it. A backgrounded
//       stream keeps filling its buffer and is persisted to its head on finish.
//
// The stream runner + abort controllers are module-level (also outside React), so
// the generation survives unmount and is only stopped on an explicit Stop.

import { atom, getDefaultStore } from 'jotai';
import { atomFamily, atomWithStorage, RESET } from 'jotai/utils';

import type {
  AdvisorAction,
  AdvisorAttachment,
  AdvisorChunk,
  AdvisorWorkflowActionBatchResult,
  AdvisorWorkflowChangeCandidate,
  AdvisorWorkflowCandidateApproval,
  AdvisorWorkflowRequest,
  AdvisorWorkflowResponse,
  AdvisorWorkflowId,
  ConversationHistoryMessage,
  ConversationMessagePage,
  ConversationSummary,
  AdvisorWorkflowEventPayload,
  AdvisorWorkflowStatus,
} from '@fintrack/types/interfaces/ai';

import type { AdvisorMessage, AdvisorWorkflowRun } from './advisor.types';
import { streamAdvisor, AdvisorStreamError } from './advisor.stream';
import { normalizeAdvisorAttachments } from './advisor.helpers';
import {
  ADVISOR_CONVERSATIONS_STORAGE_KEY,
  ADVISOR_MESSAGES_STORAGE_PREFIX,
} from '@/lib/advisor/advisor_storage.constants';

/** Max messages kept in a conversation's instant-render head (see appendToHead). */
const HEAD_CAP = 50;
const WORKFLOW_RUNS_STORAGE_KEY = 'fintrack.advisor.workflow-runs.v1';

const store = getDefaultStore();

// ── Persisted atoms ────────────────────────────────────────────────────────────

export const conversationHeadAtom = atomFamily((conversationId: string) =>
  atomWithStorage<ConversationMessagePage | null>(
    `${ADVISOR_MESSAGES_STORAGE_PREFIX}${conversationId}`,
    null,
    undefined,
    { getOnInit: true },
  ),
);

export const conversationsListAtom = atomWithStorage<ConversationSummary[]>(
  ADVISOR_CONVERSATIONS_STORAGE_KEY,
  [],
  undefined,
  { getOnInit: true },
);

export const workflowRunsAtom = atomWithStorage<Record<string, AdvisorWorkflowRun>>(
  WORKFLOW_RUNS_STORAGE_KEY,
  {},
  undefined,
  { getOnInit: true },
);

// ── Ephemeral live-stream atoms ────────────────────────────────────────────────

export interface ConversationStream {
  messages: AdvisorMessage[];
  isStreaming: boolean;
}

const EMPTY_STREAM: ConversationStream = { messages: [], isStreaming: false };

export const conversationStreamAtom = atomFamily((_conversationId: string) =>
  atom<ConversationStream>(EMPTY_STREAM),
);

// AbortControllers are not render state — kept out of atoms.
const controllers = new Map<string, AbortController>();

// When each conversation last FINISHED a turn. The chat panel only drops a live
// buffer once server history that POSTDATES this lands, so a stale refetch can
// never briefly hide the just-finished turn (no disappear/reappear).
const lastFinalizedAt = new Map<string, number>();
export function getFinalizedAt(conversationId: string): number {
  return lastFinalizedAt.get(conversationId) ?? 0;
}

function parseProposedAction(data: string): AdvisorAction | null {
  try {
    return JSON.parse(data) as AdvisorAction;
  } catch {
    return null;
  }
}

function parseActionResultFailed(data: string): boolean {
  try {
    const parsed = JSON.parse(data) as { status?: unknown };
    return parsed?.status === 'execution_failed';
  } catch {
    return false;
  }
}

function parseWorkflowActionBatchResult(data: string): AdvisorWorkflowActionBatchResult | null {
  try {
    const parsed = JSON.parse(data) as Partial<AdvisorWorkflowActionBatchResult>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      (parsed.status !== 'executed' && parsed.status !== 'execution_failed') ||
      parsed.atomic !== true ||
      typeof parsed.message !== 'string' ||
      !Array.isArray(parsed.candidateResults)
    ) {
      return null;
    }

    const candidateResults = parsed.candidateResults.filter(
      (result): result is AdvisorWorkflowActionBatchResult['candidateResults'][number] =>
        !!result &&
        typeof result === 'object' &&
        typeof result.candidateId === 'string' &&
        (result.status === 'approved' || result.status === 'failed') &&
        typeof result.message === 'string',
    );
    if (candidateResults.length !== parsed.candidateResults.length) return null;

    return {
      status: parsed.status,
      atomic: true,
      message: parsed.message,
      candidateResults,
    };
  } catch {
    return null;
  }
}

function toLiveMessage(message: ConversationHistoryMessage): AdvisorMessage {
  return {
    id: message.id,
    role: message.role === 'USER' ? 'user' : 'assistant',
    content: message.content,
    createdAt: new Date(message.createdAt),
    attachments: normalizeAdvisorAttachments(message.metadata?.attachments ?? message.attachments),
    workflowResponse: message.metadata?.workflowResponse,
    proposedAction: message.metadata?.proposedAction ?? null,
    actionState: message.metadata?.actionState,
  };
}

function workflowRunKey(conversationId: string, prompt: string): string {
  return `${conversationId}::${prompt.trim()}`;
}

/**
 * Reads locally cached workflow metadata for a persisted user turn.
 *
 * This is a bridge for conversations created before backend workflow metadata is
 * available in history; server metadata remains authoritative when present.
 */
export function readWorkflowRun(
  conversationId: string,
  prompt: string,
): AdvisorWorkflowRun | undefined {
  return store.get(workflowRunsAtom)[workflowRunKey(conversationId, prompt)];
}

/**
 * Stores workflow metadata keyed by conversation and generated prompt text.
 *
 * The cache lets the optimistic workflow card survive client refreshes while
 * the backend metadata path is being rolled out.
 */
function writeWorkflowRun(
  conversationId: string,
  prompt: string,
  workflow: AdvisorWorkflowRun,
): void {
  store.set(workflowRunsAtom, {
    ...store.get(workflowRunsAtom),
    [workflowRunKey(conversationId, prompt)]: workflow,
  });
}

/**
 * Parses workflow lifecycle event payloads from advisor stream chunks.
 *
 * Malformed payloads are ignored so a bad progress event cannot break the whole
 * chat stream.
 */
function parseWorkflowEventPayload(data: string): AdvisorWorkflowEventPayload | null {
  if (!data) return null;
  try {
    return JSON.parse(data) as AdvisorWorkflowEventPayload;
  } catch {
    return null;
  }
}

/**
 * Maps a workflow lifecycle status to the most appropriate visible stage index.
 *
 * Backend events may omit `stageIndex`; this keeps the user card moving through
 * stages using a deterministic local fallback.
 */
function workflowStageIndexForStatus(
  workflow: AdvisorWorkflowRun,
  status: AdvisorWorkflowStatus,
): number {
  const lastIndex = Math.max(workflow.stages.length - 1, 0);
  switch (status) {
    case 'started':
      return 0;
    case 'loading_context':
      return Math.min(1, lastIndex);
    case 'fetching_records':
      return Math.min(2, lastIndex);
    case 'analyzing':
      return Math.min(3, lastIndex);
    case 'checking_recommendations':
      return Math.min(4, lastIndex);
    case 'generating_response':
    case 'response_started':
    case 'completed':
      return lastIndex;
    case 'failed':
      return workflow.activeStageIndex;
  }
  return workflow.activeStageIndex;
}

/**
 * Returns the default status label for a workflow lifecycle status.
 *
 * Backend events can override this with a more specific `message` or
 * `stageLabel`.
 */
function workflowStatusLabel(status: AdvisorWorkflowStatus): string {
  switch (status) {
    case 'started':
      return 'Workflow started';
    case 'loading_context':
      return 'Loading advisor context';
    case 'fetching_records':
      return 'Gathering financial records';
    case 'analyzing':
      return 'Analyzing your finances';
    case 'checking_recommendations':
      return 'Checking recommendations';
    case 'generating_response':
      return 'Preparing workflow response';
    case 'response_started':
      return 'Writing workflow response';
    case 'completed':
      return 'Workflow response ready';
    case 'failed':
      return 'Could not complete workflow';
  }
  return 'Working on workflow';
}

/**
 * Applies a partial workflow update and writes the resulting run back to cache.
 *
 * The helper also fills missing `activeStageIndex` and `statusLabel` values so
 * every rendered workflow card has complete display state.
 */
function patchWorkflowRun(
  conversationId: string,
  prompt: string,
  workflow: AdvisorWorkflowRun,
  patch: Partial<AdvisorWorkflowRun>,
): AdvisorWorkflowRun {
  const status = patch.status ?? workflow.status;
  const activeStageIndex = patch.activeStageIndex ?? workflowStageIndexForStatus(workflow, status);
  const next: AdvisorWorkflowRun = {
    ...workflow,
    ...patch,
    status,
    activeStageIndex,
    statusLabel: patch.statusLabel ?? workflowStatusLabel(status),
  };
  writeWorkflowRun(conversationId, prompt, next);
  return next;
}

/**
 * Converts a streamed `workflow_*` chunk into a workflow-card patch.
 *
 * Non-workflow chunks return null so the normal token/HITL handling path can
 * continue unchanged.
 */
function applyWorkflowEvent(
  workflow: AdvisorWorkflowRun,
  chunk: AdvisorChunk,
): Partial<AdvisorWorkflowRun> | null {
  if (!chunk.type.startsWith('workflow_')) return null;

  const payload = parseWorkflowEventPayload(chunk.data);
  const payloadStatus = payload?.status;
  const payloadStageIndex =
    typeof payload?.stageIndex === 'number' ? payload.stageIndex : undefined;

  switch (chunk.type) {
    case 'workflow_started':
      return {
        status: payloadStatus ?? 'started',
        activeStageIndex: payloadStageIndex ?? 0,
        statusLabel: payload?.message ?? payload?.stageLabel ?? workflowStatusLabel('started'),
      };
    case 'workflow_progress': {
      const status = payloadStatus ?? workflow.status;
      return {
        status,
        activeStageIndex: payloadStageIndex,
        statusLabel: payload?.message ?? payload?.stageLabel ?? workflowStatusLabel(status),
      };
    }
    case 'workflow_response_started':
      return {
        status: payloadStatus ?? 'response_started',
        activeStageIndex: payloadStageIndex,
        statusLabel:
          payload?.message ?? payload?.stageLabel ?? workflowStatusLabel('response_started'),
      };
    case 'workflow_completed':
      return {
        status: payloadStatus ?? 'completed',
        activeStageIndex: payloadStageIndex,
        statusLabel: payload?.message ?? workflowStatusLabel('completed'),
      };
    case 'workflow_failed':
      return {
        status: payloadStatus ?? 'failed',
        activeStageIndex: payloadStageIndex,
        statusLabel: payload?.message ?? workflowStatusLabel('failed'),
      };
    default:
      return null;
  }
}

const WORKFLOW_SECTION_TITLES = [
  'Snapshot',
  'Findings',
  'Evidence',
  'Change candidates',
  'Budget snapshot',
  'Categories to watch',
  'Adjustment logic',
  'Forecast snapshot',
  'Pressure points',
  'Risk window',
  'Monthly snapshot',
  'Wins',
  'Risks',
  'Recommendation',
  'Recommended action',
] as const;

function normalizeWorkflowMarkdown(content: string): string {
  return WORKFLOW_SECTION_TITLES.reduce((text, title) => {
    const pattern = new RegExp(`\\s*#{1,6}\\s+${escapeRegExp(title)}\\b\\s*`, 'gi');
    return text.replace(pattern, `\n\n### ${title}\n`);
  }, content);
}

function firstWorkflowParagraph(content: string): string {
  const normalized = normalizeWorkflowMarkdown(content);
  const paragraph = normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith('#'));
  if (paragraph) return truncateWorkflowSummary(paragraph);

  const sections = workflowResponseSections(normalized);
  const firstSectionItem = sections.find((section) => section.items.length > 0)?.items[0];
  return truncateWorkflowSummary(firstSectionItem ?? content.trim());
}

function workflowResponseSections(content: string): AdvisorWorkflowResponse['sections'] {
  const normalizedContent = normalizeWorkflowMarkdown(content);
  const sections: AdvisorWorkflowResponse['sections'] = [];
  let current: AdvisorWorkflowResponse['sections'][number] | null = null;

  for (const rawLine of normalizedContent.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      current = { title: heading[1]!.trim(), items: [] };
      sections.push(current);
      continue;
    }

    if (!current) continue;
    const item = line.replace(/^[-*]\s+/, '').trim();
    if (item) current.items.push(item);
  }

  return sections
    .map((section) => ({ ...section, items: section.items.filter(Boolean).slice(0, 5) }))
    .filter((section) => section.items.length > 0)
    .slice(0, 4);
}

function workflowMetricLabels(workflowId: AdvisorWorkflowId): string[] {
  return {
    'bill-subscription-auditor': ['Monthly bills', 'Potential savings', 'Cost change'],
    'cash-flow-forecast': ['Cash buffer', 'Forecast balance', 'Pressure amount'],
    'budget-rebalancer': ['Current budget', 'Suggested budget', 'Net change'],
    'monthly-money-review': ['Money in', 'Money out', 'Net position'],
  }[workflowId];
}

function workflowResponseMetrics(
  workflowId: AdvisorWorkflowId,
  content: string,
): AdvisorWorkflowResponse['metrics'] {
  const matches = content.match(/(?:₦\s?[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?%)/g) ?? [];
  const labels = workflowMetricLabels(workflowId);
  return Array.from(new Set(matches))
    .slice(0, 3)
    .map((value, index) => ({
      label: labels[index] ?? `Metric ${index + 1}`,
      value,
      tone: 'neutral' as const,
    }));
}

function buildWorkflowResponse(
  workflow: AdvisorWorkflowRun,
  content: string,
): AdvisorWorkflowResponse {
  const sections = workflowResponseSections(content);
  const recommendationSection = sections.find((section) => /recommend/i.test(section.title));
  const candidateSection = sections.find((section) =>
    /change candidates?|candidates?|adjustments?/i.test(section.title),
  );

  return {
    workflowRunId: workflow.id,
    workflowId: workflow.workflowId,
    title: workflow.title,
    summary: firstWorkflowParagraph(content),
    metrics: workflowResponseMetrics(workflow.workflowId, content),
    sections: sections.length
      ? sections
          .filter((section) => !/recommend/i.test(section.title))
          .filter((section) => !/change candidates?|candidates?|adjustments?/i.test(section.title))
      : [{ title: 'Summary', items: [firstWorkflowParagraph(content)] }],
    ...(candidateSection
      ? { candidates: workflowChangeCandidates(workflow.id, candidateSection.items) }
      : {}),
    ...(recommendationSection?.items[0]
      ? {
          recommendation: {
            title: recommendationSection.title,
            detail: recommendationSection.items[0],
          },
        }
      : {}),
    generatedAt: new Date().toISOString(),
  };
}

function workflowChangeCandidates(
  workflowRunId: string,
  items: string[],
): NonNullable<AdvisorWorkflowResponse['candidates']> {
  return normalizeWorkflowCandidateItems(items)
    .slice(0, 8)
    .map((item, index) => {
      const { title, detail } = splitWorkflowCandidate(item);
      return {
        id: `${workflowRunId}-candidate-${index + 1}`,
        title: stripWorkflowEvidenceTags(title),
        detail: stripWorkflowEvidenceTags(detail),
        selected: true,
      };
    });
}

function normalizeWorkflowCandidateItems(items: string[]): string[] {
  const candidates: Array<{ display: string; hasEvidence: boolean }> = [];

  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (isStandaloneWorkflowEvidenceTag(trimmed)) {
      const previous = candidates[candidates.length - 1];
      if (previous) previous.hasEvidence = true;
      continue;
    }
    candidates.push({
      display: trimmed,
      hasEvidence: parseWorkflowEvidenceKind(trimmed),
    });
  }

  const hasStructuredCandidates = candidates.some((candidate) => candidate.hasEvidence);
  return (
    hasStructuredCandidates ? candidates.filter((candidate) => candidate.hasEvidence) : candidates
  ).map((candidate) => candidate.display);
}

function isStandaloneWorkflowEvidenceTag(candidate: string): boolean {
  return /^\[[^\]]+\]$/.test(candidate.trim());
}

function parseWorkflowEvidenceKind(candidate: string): boolean {
  return /\[\s*kind=/.test(candidate);
}

function stripWorkflowEvidenceTags(value: string): string {
  return value.replace(/\[[^\]]+\]\s*/g, '').trim();
}

function splitWorkflowCandidate(item: string): { title: string; detail: string } {
  const normalized = item.replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  const split = normalized.match(
    /^(.+?(?:₦\s?[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?%))(?:\s+(to|because|so|for)\s+(.+))$/i,
  );
  if (!split) return { title: normalized, detail: '' };

  return {
    title: split[1]!.trim(),
    detail: `${split[2]!.toLowerCase()} ${split[3]!.trim()}.`,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truncateWorkflowSummary(value: string, maxLength = 220): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;

  const truncated = normalized.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, lastSpace > 120 ? lastSpace : maxLength).trimEnd()}…`;
}

function patchStream(
  conversationId: string,
  patch: (prev: ConversationStream) => ConversationStream,
): void {
  const a = conversationStreamAtom(conversationId);
  store.set(a, patch(store.get(a)));
}

/** Drops a conversation's live buffer once server history is authoritative. */
export function clearConversationStream(conversationId: string): void {
  const a = conversationStreamAtom(conversationId);
  if (store.get(a).messages.length === 0) return;
  store.set(a, EMPTY_STREAM);
}

/**
 * Forgets everything for a conversation (on permanent delete): aborts any
 * in-flight stream, drops the live buffer, and removes the persisted head from
 * localStorage so a deleted thread leaves nothing behind.
 */
export function clearConversationData(conversationId: string): void {
  controllers.get(conversationId)?.abort();
  controllers.delete(conversationId);
  lastFinalizedAt.delete(conversationId);

  store.set(conversationStreamAtom(conversationId), EMPTY_STREAM);
  conversationStreamAtom.remove(conversationId);

  store.set(conversationHeadAtom(conversationId), RESET);
  conversationHeadAtom.remove(conversationId);
}

/** Mutates a single live message (e.g. an HITL action state). */
export function patchLiveMessage(
  conversationId: string,
  messageId: string,
  patch: Partial<AdvisorMessage>,
): void {
  patchStream(conversationId, (prev) => ({
    ...prev,
    messages: prev.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
  }));
}

// ── Persisted head helpers ─────────────────────────────────────────────────────

export function readHead(conversationId: string): ConversationMessagePage | null {
  return store.get(conversationHeadAtom(conversationId));
}

export function writeHead(conversationId: string, page: ConversationMessagePage): void {
  store.set(conversationHeadAtom(conversationId), page);
}

/**
 * Appends completed turn message(s) to a thread's head cache. De-dupes by id
 * (a message can never appear twice), trims to {@link HEAD_CAP}, and keeps the
 * cursor consistent so older pages stay fetchable (no gap, no dup).
 */
export function appendToHead(conversationId: string, incoming: ConversationHistoryMessage[]): void {
  if (incoming.length === 0) return;

  const existing = readHead(conversationId);
  const base = existing?.messages ?? [];

  const byId = new Map<string, ConversationHistoryMessage>();
  for (const m of base) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  const merged = Array.from(byId.values());

  const trimmed = merged.length > HEAD_CAP ? merged.slice(-HEAD_CAP) : merged;
  const olderExist = existing?.nextCursor != null || merged.length > HEAD_CAP;
  const nextCursor = olderExist ? (trimmed[0]?.id ?? null) : null;

  writeHead(conversationId, { messages: trimmed, nextCursor });
}

function findHeadMessage(conversationId: string, messageId: string): AdvisorMessage | null {
  const message = readHead(conversationId)?.messages.find((m) => m.id === messageId);
  return message ? toLiveMessage(message) : null;
}

function patchHeadActionState(
  conversationId: string,
  messageId: string,
  actionState: AdvisorMessage['actionState'],
): void {
  const head = readHead(conversationId);
  if (!head) return;

  writeHead(conversationId, {
    ...head,
    messages: head.messages.map((message) => {
      if (message.id !== messageId) return message;
      return {
        ...message,
        metadata: {
          ...(message.metadata ?? {}),
          actionState,
        },
      };
    }),
  });
}

function patchWorkflowCandidateList(
  candidates: AdvisorWorkflowChangeCandidate[] | undefined,
  candidateIds: string[],
  state: NonNullable<AdvisorWorkflowChangeCandidate['state']>,
): AdvisorWorkflowChangeCandidate[] | undefined {
  if (!candidates?.length) return candidates;
  const selected = new Set(candidateIds);
  return candidates.map((candidate) =>
    selected.has(candidate.id) ? { ...candidate, state } : candidate,
  );
}

function patchLiveWorkflowCandidateState(
  conversationId: string,
  responseMessageId: string,
  candidateIds: string[],
  state: NonNullable<AdvisorWorkflowChangeCandidate['state']>,
): void {
  patchStream(conversationId, (prev) => ({
    ...prev,
    messages: (() => {
      let found = false;
      const messages = prev.messages.map((message) => {
        if (message.id !== responseMessageId || !message.workflowResponse) return message;
        found = true;
        return {
          ...message,
          workflowResponse: {
            ...message.workflowResponse,
            candidates: patchWorkflowCandidateList(
              message.workflowResponse.candidates,
              candidateIds,
              state,
            ),
          },
        };
      });

      if (found) return messages;

      const historyMessage = findHeadMessage(conversationId, responseMessageId);
      if (!historyMessage?.workflowResponse) return messages;

      return [
        ...messages,
        {
          ...historyMessage,
          workflowResponse: {
            ...historyMessage.workflowResponse,
            candidates: patchWorkflowCandidateList(
              historyMessage.workflowResponse.candidates,
              candidateIds,
              state,
            ),
          },
        },
      ];
    })(),
  }));
}

function patchHeadWorkflowCandidateState(
  conversationId: string,
  responseMessageId: string,
  candidateIds: string[],
  state: NonNullable<AdvisorWorkflowChangeCandidate['state']>,
): void {
  const head = readHead(conversationId);
  if (!head) return;

  writeHead(conversationId, {
    ...head,
    messages: head.messages.map((message) => {
      if (message.id !== responseMessageId || !message.metadata?.workflowResponse) {
        return message;
      }
      return {
        ...message,
        metadata: {
          ...(message.metadata ?? {}),
          workflowResponse: {
            ...message.metadata.workflowResponse,
            candidates: patchWorkflowCandidateList(
              message.metadata.workflowResponse.candidates,
              candidateIds,
              state,
            ),
          },
        },
      };
    }),
  });
}

function expirePendingActionMessages(conversationId: string): void {
  patchStream(conversationId, (prev) => ({
    ...prev,
    messages: prev.messages.map((message) =>
      message.proposedAction && (message.actionState ?? 'pending') === 'pending'
        ? { ...message, actionState: 'expired' }
        : message,
    ),
  }));

  const head = readHead(conversationId);
  if (!head) return;

  writeHead(conversationId, {
    ...head,
    messages: head.messages.map((message) => {
      const hasPendingAction =
        !!message.metadata?.proposedAction &&
        (message.metadata.actionState ?? 'pending') === 'pending';
      if (!hasPendingAction) return message;

      return {
        ...message,
        metadata: {
          ...(message.metadata ?? {}),
          actionState: 'expired',
        },
      };
    }),
  });
}

// ── Stream runner (runs outside React; survives unmount/navigation) ────────────

/** Aborts an in-flight stream (explicit Stop only — never on navigation). */
export function stopConversationStream(conversationId: string): void {
  controllers.get(conversationId)?.abort();
}

/**
 * Streams one user message for a conversation, writing tokens into that
 * conversation's live buffer. On success the completed turn is appended to the
 * persisted head so a reopen/reload paints it instantly. Errors are surfaced
 * through `onError` and are not rendered or cached as assistant messages.
 */
export async function streamConversationMessage(args: {
  conversationId: string;
  message: string;
  attachments?: AdvisorAttachment[];
  workflow?: AdvisorWorkflowRun;
  workflowRequest?: AdvisorWorkflowRequest;
  onFinished?: () => void;
  onError?: (message: string) => void;
}): Promise<void> {
  const { conversationId, message, attachments = [], workflow, workflowRequest } = args;

  const userMessage: AdvisorMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: message,
    createdAt: new Date(),
    workflow,
    attachments,
  };
  const assistantId = crypto.randomUUID();
  let workflowState = workflow;

  if (workflow) {
    writeWorkflowRun(conversationId, message, workflow);
  }

  expirePendingActionMessages(conversationId);
  patchStream(conversationId, (prev) => ({
    isStreaming: true,
    messages: [
      ...prev.messages,
      userMessage,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date() },
    ],
  }));

  const controller = new AbortController();
  controllers.set(conversationId, controller);

  let assistantContent = '';
  let proposedAction: AdvisorAction | null = null;
  let succeeded = false;
  let workflowResponseStarted = false;

  try {
    await streamAdvisor({
      conversationId,
      message,
      attachments,
      workflowRun: workflow,
      workflow: workflowRequest,
      signal: controller.signal,
      onToken: (delta) => {
        assistantContent += delta;

        if (workflowState && !workflowResponseStarted) {
          workflowResponseStarted = true;
          workflowState = patchWorkflowRun(conversationId, message, workflowState, {
            status: 'response_started',
          });
          patchStream(conversationId, (prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === userMessage.id ? { ...m, workflow: workflowState } : m,
            ),
          }));
        }

        if (workflowState) return;

        patchStream(conversationId, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + delta } : m,
          ),
        }));
      },
      onEvent: (chunk) => {
        if (workflowState) {
          const workflowPatch = applyWorkflowEvent(workflowState, chunk);
          if (workflowPatch) {
            workflowState = patchWorkflowRun(conversationId, message, workflowState, workflowPatch);
            patchStream(conversationId, (prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === userMessage.id ? { ...m, workflow: workflowState } : m,
              ),
            }));
            return;
          }
        }

        if (chunk.type !== 'approval_required') return;
        const action = parseProposedAction(chunk.data);
        if (!action) return;
        proposedAction = action;
        patchStream(conversationId, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantId ? { ...m, proposedAction: action, actionState: 'pending' } : m,
          ),
        }));
      },
    });
    succeeded = true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      const note =
        err instanceof AdvisorStreamError
          ? 'Sorry, I could not finish that. Please try again.'
          : 'Something went wrong reaching the advisor. Please try again.';
      args.onError?.(note);
      patchStream(conversationId, (prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== assistantId),
      }));
      if (workflow) {
        const failedWorkflow = patchWorkflowRun(
          conversationId,
          message,
          workflowState ?? workflow,
          { status: 'failed' },
        );
        writeWorkflowRun(conversationId, message, failedWorkflow);
        patchStream(conversationId, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === userMessage.id ? { ...m, workflow: failedWorkflow } : m,
          ),
        }));
      }
    }
  } finally {
    if (controllers.get(conversationId) === controller) {
      controllers.delete(conversationId);
    }
    patchStream(conversationId, (prev) => ({ ...prev, isStreaming: false }));

    // Mark the turn end on EVERY exit (success or abort), so the chat panel keeps
    // the live buffer until server history that postdates this turn lands. On
    // abort the user turn (and any partial) is already persisted server-side, so
    // without this the buffer would be cleared against stale history and the
    // just-sent messages would blink out before the refetch brings them back.
    lastFinalizedAt.set(conversationId, Date.now());

    if (succeeded) {
      let workflowResponse: AdvisorWorkflowResponse | undefined;
      if (workflow) {
        const completedWorkflow = patchWorkflowRun(
          conversationId,
          message,
          workflowState ?? workflow,
          { status: 'completed' },
        );
        workflowResponse = assistantContent.trim()
          ? buildWorkflowResponse(completedWorkflow, assistantContent)
          : undefined;
        writeWorkflowRun(conversationId, message, completedWorkflow);
        patchStream(conversationId, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === userMessage.id
              ? { ...m, workflow: completedWorkflow }
              : m.id === assistantId && workflowResponse
                ? { ...m, workflowResponse }
                : m,
          ),
        }));
      }

      const completedMessages: ConversationHistoryMessage[] = [
        {
          id: userMessage.id,
          role: 'USER',
          content: userMessage.content,
          createdAt: userMessage.createdAt,
          ...(attachments.length > 0
            ? {
                metadata: {
                  attachments,
                },
              }
            : {}),
        },
      ];

      if (!proposedAction) {
        completedMessages.push({
          id: assistantId,
          role: 'ASSISTANT',
          content: assistantContent,
          createdAt: new Date(),
          ...(workflowResponse
            ? {
                metadata: {
                  workflowResponse,
                },
              }
            : {}),
        });
      }

      appendToHead(conversationId, completedMessages);
    }

    args.onFinished?.();
  }
}

export async function resumeConversation(args: {
  conversationId: string;
  approved: boolean;
  actionMessageId: string;
  onFinished?: () => void;
  onError?: (message: string) => void;
}): Promise<AdvisorMessage['actionState']> {
  const { conversationId, approved, actionMessageId } = args;
  const assistantId = crypto.randomUUID();
  const actionState: AdvisorMessage['actionState'] = approved ? 'approved' : 'rejected';
  const processingState: AdvisorMessage['actionState'] = 'processing';
  let finalActionState: AdvisorMessage['actionState'] = 'failed';

  patchStream(conversationId, (prev) => ({
    isStreaming: true,
    messages: (() => {
      let foundAction = false;
      const messages = prev.messages.map((m) => {
        if (m.id !== actionMessageId) return m;
        foundAction = true;
        return { ...m, actionState: processingState };
      });

      if (!foundAction) {
        const historyMessage = findHeadMessage(conversationId, actionMessageId);
        if (historyMessage) {
          messages.push({ ...historyMessage, actionState: processingState });
        }
      }

      messages.push({
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      });
      return messages;
    })(),
  }));
  patchHeadActionState(conversationId, actionMessageId, processingState);

  const controller = new AbortController();
  controllers.set(conversationId, controller);

  let assistantContent = '';
  let proposedAction: AdvisorAction | null = null;
  let actionExecutionFailed = false;
  let succeeded = false;

  try {
    await streamAdvisor({
      conversationId,
      resume: { approved, actionMessageId },
      signal: controller.signal,
      onToken: (delta) => {
        assistantContent += delta;
        patchStream(conversationId, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + delta } : m,
          ),
        }));
      },
      onEvent: (chunk) => {
        if (chunk.type === 'action_result') {
          actionExecutionFailed = actionExecutionFailed || parseActionResultFailed(chunk.data);
          return;
        }

        if (chunk.type !== 'approval_required') return;
        const action = parseProposedAction(chunk.data);
        if (!action) return;
        proposedAction = action;
        patchStream(conversationId, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantId ? { ...m, proposedAction: action, actionState: 'pending' } : m,
          ),
        }));
      },
    });
    succeeded = true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      const note =
        err instanceof AdvisorStreamError
          ? 'Sorry, I could not finish that. Please try again.'
          : 'Something went wrong reaching the advisor. Please try again.';
      args.onError?.(note);
      patchStream(conversationId, (prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== assistantId),
      }));
    }
  } finally {
    if (controllers.get(conversationId) === controller) {
      controllers.delete(conversationId);
    }
    patchStream(conversationId, (prev) => ({
      ...prev,
      isStreaming: false,
      messages: prev.messages.map((m) =>
        m.id === actionMessageId
          ? {
              ...m,
              actionState: succeeded && !actionExecutionFailed ? actionState : 'failed',
            }
          : m,
      ),
    }));
    finalActionState = succeeded && !actionExecutionFailed ? actionState : 'failed';
    patchHeadActionState(conversationId, actionMessageId, finalActionState);
    lastFinalizedAt.set(conversationId, Date.now());

    if (succeeded && (assistantContent.trim() || proposedAction)) {
      appendToHead(conversationId, [
        {
          id: assistantId,
          role: 'ASSISTANT',
          content: assistantContent,
          createdAt: new Date(),
          ...(proposedAction
            ? {
                metadata: {
                  proposedAction,
                  actionState: 'pending',
                },
              }
            : {}),
        },
      ]);
    }

    args.onFinished?.();
  }

  return finalActionState;
}

export async function approveWorkflowCandidates(args: {
  conversationId: string;
  responseMessageId: string;
  selectedCandidateIds: string[];
  onFinished?: () => void;
  onError?: (message: string) => void;
}): Promise<void> {
  const { conversationId, responseMessageId, selectedCandidateIds } = args;
  if (selectedCandidateIds.length === 0) return;

  const workflowApproval: AdvisorWorkflowCandidateApproval = {
    responseMessageId,
    selectedCandidateIds,
  };

  patchLiveWorkflowCandidateState(
    conversationId,
    responseMessageId,
    selectedCandidateIds,
    'processing',
  );
  patchHeadWorkflowCandidateState(
    conversationId,
    responseMessageId,
    selectedCandidateIds,
    'processing',
  );
  patchStream(conversationId, (prev) => ({
    isStreaming: true,
    messages: prev.messages,
  }));

  const controller = new AbortController();
  controllers.set(conversationId, controller);

  let workflowActionBatchResult: AdvisorWorkflowActionBatchResult | null = null;
  let succeeded = false;

  try {
    await streamAdvisor({
      conversationId,
      workflowApproval,
      signal: controller.signal,
      onToken: () => undefined,
      onEvent: (chunk) => {
        if (chunk.type !== 'workflow_action_batch_result') return;
        workflowActionBatchResult = parseWorkflowActionBatchResult(chunk.data);
        if (workflowActionBatchResult?.status === 'execution_failed') {
          args.onError?.(workflowActionBatchResult.message);
        }
      },
    });
    succeeded = true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      const note =
        err instanceof AdvisorStreamError
          ? workflowApprovalErrorMessage(err)
          : 'Something went wrong reaching the advisor. Please try again.';
      args.onError?.(note);
    }
  } finally {
    if (controllers.get(conversationId) === controller) {
      controllers.delete(conversationId);
    }

    const candidateResults =
      (workflowActionBatchResult as AdvisorWorkflowActionBatchResult | null)?.candidateResults ??
      [];
    if (candidateResults.length > 0) {
      const approvedIds = candidateResults
        .filter((result) => result.status === 'approved')
        .map((result) => result.candidateId);
      const failedIds = candidateResults
        .filter((result) => result.status === 'failed')
        .map((result) => result.candidateId);

      if (approvedIds.length > 0) {
        patchLiveWorkflowCandidateState(conversationId, responseMessageId, approvedIds, 'approved');
        patchHeadWorkflowCandidateState(conversationId, responseMessageId, approvedIds, 'approved');
      }
      if (failedIds.length > 0) {
        patchLiveWorkflowCandidateState(conversationId, responseMessageId, failedIds, 'failed');
        patchHeadWorkflowCandidateState(conversationId, responseMessageId, failedIds, 'failed');
      }
    } else {
      const finalState = succeeded ? 'approved' : 'failed';
      patchLiveWorkflowCandidateState(
        conversationId,
        responseMessageId,
        selectedCandidateIds,
        finalState,
      );
      patchHeadWorkflowCandidateState(
        conversationId,
        responseMessageId,
        selectedCandidateIds,
        finalState,
      );
    }
    patchStream(conversationId, (prev) => ({ ...prev, isStreaming: false }));
    lastFinalizedAt.set(conversationId, Date.now());

    args.onFinished?.();
  }
}

function workflowApprovalErrorMessage(error: AdvisorStreamError): string {
  return (
    error.message.replace(/^Advisor request failed:\s*/i, '').trim() ||
    'Sorry, I could not confirm those workflow candidates. Please try again.'
  );
}
