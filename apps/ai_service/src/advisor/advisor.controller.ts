import { Observable } from 'rxjs';

import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';

import {
  AI_SERVICE_NAME,
  AdvisorChunkRes,
  AdvisorMessageReq,
} from '@fintrack/types/protos/ai/ai';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { AdvisorScope, User } from '@fintrack/database/types';

import { AdvisorService } from './advisor.service';
import { GraphStreamEvent } from '../registory/lang.types';
import { AdvisorStateType } from './advisor.graph';
import { ADVISOR_NODES } from './advisor.constants';

/**
 * gRPC controller for the advisor streaming surface.
 *
 * `SendAdvisorMessage` is server-streaming: it runs the advisor graph and emits
 * an {@link AdvisorChunkRes} per stream event — text tokens as they generate,
 * plus human-in-the-loop events (approval/permission) as structured JSON. The
 * gateway bridges this gRPC stream to SSE for the web client.
 *
 * Auth mirrors the classification controller: `RpcAuthGuard` validates the JWT
 * from gRPC metadata and `@RpcUser()` exposes the caller, so the user identity is
 * never taken from the request body.
 */
@UseGuards(RpcAuthGuard)
@Controller()
export class AdvisorController {
  private readonly logger = new Logger(AdvisorController.name);

  constructor(private readonly advisorService: AdvisorService) {}

  @GrpcMethod(AI_SERVICE_NAME, 'SendAdvisorMessage')
  sendAdvisorMessage(
    @Payload() request: AdvisorMessageReq,
    @RpcUser() user: User,
  ): Observable<AdvisorChunkRes> {
    this.logger.debug(
      `[ADV-AI] gRPC SendAdvisorMessage IN convo=${request.conversationId} msgLen=${request.message?.length ?? 0} scopes=[${(request.grantedScopes ?? []).join(',')}]`,
    );
    return new Observable<AdvisorChunkRes>((subscriber) => {
      // Drive the async generator into the gRPC stream; complete on end, and
      // surface any failure as a final `error` chunk rather than a stream error.
      void (async () => {
        let chunkCount = 0;
        try {
          const events = this.advisorService.streamResponse({
            userId: user.id,
            conversationId: request.conversationId,
            message: request.message,
            grantedScopes: request.grantedScopes as AdvisorScope[],
          });

          for await (const event of events) {
            const chunk = this.advisorService.toChunk(event);
            if (chunk) {
              chunkCount += 1;
              subscriber.next(chunk);
            }
          }
          this.logger.debug(
            `[ADV-AI] gRPC stream COMPLETE convo=${request.conversationId} chunks=${chunkCount}`,
          );
          subscriber.complete();
        } catch (err) {
          this.logger.error(
            `[ADV-AI] gRPC stream FAILED convo=${request.conversationId} after ${chunkCount} chunks: ${(err as Error).message}`,
            (err as Error).stack,
          );
          // User-safe message only — the real error is logged above, never sent
          // over the wire. Retries are already exhausted by the time we get here.
          subscriber.next({
            type: 'error',
            content:
              'Sorry, I ran into a problem finishing that. Please try again in a moment.',
            data: '',
          });
          subscriber.complete();
        }
      })();
    });
  }
}
