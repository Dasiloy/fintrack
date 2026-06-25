import { env } from '@/env';
import { auth } from '@/lib/nextauth';
import { NextResponse } from 'next/server';
import { consoleLogger } from '@fintrack/common/console_logger/index';

/**
 * Advisor streaming proxy.
 *
 * The browser POSTs `{ conversationId, message }` here (same-origin, so the
 * session cookie rides along). This handler authenticates via the session,
 * attaches the bearer token, and forwards to the gateway's `@Sse` endpoint
 * (`GET /advisor/message`) with the inputs as query params, piping the
 * Server-Sent Events straight back to the client. Each `data:` line is one
 * advisor chunk `{ type, content, data }`.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { conversationId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const conversationId = body.conversationId?.trim();
  const message = body.message?.trim();
  if (!conversationId || !message) {
    return NextResponse.json({ error: 'conversationId and message are required' }, { status: 400 });
  }

  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
    ...(request.headers.get('cookie') ? { Cookie: request.headers.get('cookie') as string } : {}),
  };

  // Step 1 — stage the message (POST body) and get a one-time stream token.
  let streamToken: string;
  try {
    const stageRes = await fetch(`${env.API_GATEWAY_URL}/api/advisor/message`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message }),
    });
    if (!stageRes.ok) {
      return NextResponse.json(
        { error: 'Advisor not avaliable right now' },
        { status: stageRes.status || 502 },
      );
    }
    const staged = (await stageRes.json()) as {
      data?: { streamToken?: string };
    };
    if (!staged.data?.streamToken) {
      return NextResponse.json({ error: 'Advisor stream failed to start' }, { status: 502 });
    }
    streamToken = staged.data.streamToken;
  } catch (err) {
    consoleLogger.error('advisor.stage', err);
    return NextResponse.json({ error: 'Advisor service is unavailable' }, { status: 502 });
  }

  // Step 2 — open the SSE stream by token and pipe it back unchanged.
  let upstream: Response;
  try {
    upstream = await fetch(
      `${env.API_GATEWAY_URL}/api/advisor/message/stream?token=${encodeURIComponent(streamToken)}`,
      {
        method: 'GET',
        headers: { ...authHeaders, Accept: 'text/event-stream' },
        // Propagate the client's abort (Stop / navigation): when the browser
        // aborts this request, tear down the upstream SSE so the gateway drops
        // its gRPC stream and the ai_service aborts the graph run.
        signal: request.signal,
      },
    );
  } catch (err) {
    consoleLogger.error('advisor.stream', err);
    return NextResponse.json({ error: 'Advisor service is unavailable' }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: 'Advisor stream failed to start' },
      { status: upstream.status || 502 },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
