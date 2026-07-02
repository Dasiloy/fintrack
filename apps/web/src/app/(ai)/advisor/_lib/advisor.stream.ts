import type {
  AdvisorAttachment,
  AdvisorChunk,
  AdvisorWorkflowCandidateApproval,
  AdvisorWorkflowRequest,
  AdvisorWorkflowRun,
} from '@fintrack/types/interfaces/ai';

// ── Advisor SSE client ────────────────────────────────────────────────────────
// Reads the advisor stream from the Next proxy (`/api/advisor`) and dispatches
// typed chunks. Built to be resilient: it buffers partial network frames,
// tolerates malformed lines, surfaces server-sent error chunks, and supports
// cancellation via an AbortSignal.

export interface StreamAdvisorHandlers {
  /** Called for each text delta as the advisor responds. */
  onToken: (delta: string) => void;
  /** Called for structured HITL chunks (approval_required / permission_required). */
  onEvent?: (chunk: AdvisorChunk) => void;
}

export interface StreamAdvisorOptions extends StreamAdvisorHandlers {
  conversationId: string;
  message?: string;
  resume?: { approved: boolean; actionMessageId: string };
  workflowApproval?: AdvisorWorkflowCandidateApproval;
  attachments?: AdvisorAttachment[];
  workflowRun?: AdvisorWorkflowRun;
  workflow?: AdvisorWorkflowRequest;
  signal?: AbortSignal;
}

/** Thrown when the stream cannot start or the server emits an error chunk. */
export class AdvisorStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdvisorStreamError';
  }
}

/**
 * Opens the advisor stream and resolves when it completes. Rejects with an
 * `AdvisorStreamError` on a failed start or a server error chunk, and propagates
 * the native `AbortError` when cancelled via `signal`.
 */
export async function streamAdvisor(opts: StreamAdvisorOptions): Promise<void> {
  const response = await fetch('/api/advisor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: opts.conversationId,
      ...(opts.resume
        ? { resume: opts.resume }
        : opts.workflowApproval
          ? { workflowApproval: opts.workflowApproval }
        : {
            message: opts.message ?? '',
            attachments: opts.attachments ?? [],
            ...(opts.workflowRun ? { workflowRun: opts.workflowRun } : {}),
            ...(opts.workflow ? { workflow: opts.workflow } : {}),
          }),
    }),
    signal: opts.signal,
  });

  if (!response.ok || !response.body) {
    let detail = `status ${response.status}`;
    try {
      const err = (await response.json()) as { error?: string };
      if (err?.error) detail = err.error;
    } catch {
      // non-JSON error body — keep the status detail
    }
    throw new AdvisorStreamError(`Advisor request failed: ${detail}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line; process every complete frame.
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        dispatchFrame(frame, opts);
      }
    }

    // Flush any trailing frame that arrived without a final blank line.
    if (buffer.trim()) dispatchFrame(buffer, opts);
  } finally {
    reader.releaseLock();
  }
}

/** Parses one SSE frame's `data:` payload and routes it to the handlers. */
function dispatchFrame(frame: string, handlers: StreamAdvisorHandlers): void {
  const dataLine = frame.split('\n').find((line) => line.startsWith('data:'));
  if (!dataLine) return;

  const payload = dataLine.slice(5).trim();
  if (!payload) return;

  let chunk: AdvisorChunk;
  try {
    chunk = JSON.parse(payload) as AdvisorChunk;
  } catch {
    return; // ignore a malformed frame rather than break the whole stream
  }

  switch (chunk.type) {
    case 'token':
      if (chunk.content) handlers.onToken(chunk.content);
      return;
    case 'error':
      throw new AdvisorStreamError(chunk.content || 'Advisor stream error');
    default:
      handlers.onEvent?.(chunk);
  }
}
