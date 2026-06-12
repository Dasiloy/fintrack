import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  RawBody,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '@fintrack/database/types';
import {
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
} from '@fintrack/types/protos/payment/payment';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { PaymentService } from './payment.service';
import { PaystackSig } from '../decorators/paystack_decorator';

import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';
import { OriginUrl } from '../decorators/origin_decorator';
import { CreatePortalSessionDto } from './dtos/portal.dto';
import { Throttle } from '@nestjs/throttler';

/**
 * Controller responsible for managing user payment and subscriptions
 * Handles HTTP requests for CRUD operations on payment and subscriptions
 *
 * @class PaymentController
 */
@ApiTags('Payments')
@ApiBearerAuth()
@Controller({
  path: 'payment',
})
/**
 * PaymentController.
 */
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ================================================================
  //. Subscribe a user to a paid plan
  // ================================================================
  @Post('subscribe')
  @UseGuards(ApiGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe a user to a pro plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscribe a user to a pro plan',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'User subscribed to a paid plan',
        data: {
          checkoutSessionUrl:
            'https://checkout.paystack.com/example_checkout_url',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Customer information missing!',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Customer information missing!',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized!',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized!',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error!',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error!',
        data: null,
      },
    },
  })
  async subscribe(
    @CurrentUser() user: User,
    @OriginUrl() originUrl: string,
  ): Promise<StandardResponse<CreateCheckoutSessionResponse>> {
    const checkoutSession = await this.paymentService.createCheckoutSession({
      userId: user.id,
      originUrl,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User subscribed to pro plan',
      data: checkoutSession,
    };
  }

  // ================================================================
  //. Create a portal session for a user
  // ================================================================
  @Post('portal')
  @UseGuards(ApiGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a portal session for a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Create a portal session for a user',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Portal session created',
        data: {
          portalSessionUrl: 'https://paystack.com/manage/subscriptions/example',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Customer information missing!',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Customer information missing!',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized!',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized!',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error!',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error!',
        data: null,
      },
    },
  })
  async createPortalSession(
    @CurrentUser() user: User,
    @OriginUrl() originUrl: string,
    @Body() body: CreatePortalSessionDto,
  ): Promise<StandardResponse<CreatePortalSessionResponse>> {
    const portalSession = await this.paymentService.createPortalSession({
      userId: user.id,
      originUrl: body.returnUrl || originUrl,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Portal session created',
      data: portalSession,
    };
  }
  // ================================================================
  //. Start the 2-month free Pro trial
  // ================================================================
  @Post('trial')
  @UseGuards(ApiGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start the 2-month free Pro trial' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Paystack payment URL returned — redirect user to capture card',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Trial session created',
        data: { checkoutSessionUrl: 'https://checkout.paystack.com/...' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Trial already used for this email address',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'Trial already used',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized!',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error!',
        data: null,
      },
    },
  })
  async startTrial(
    @CurrentUser() user: User,
    @OriginUrl() originUrl: string,
  ): Promise<StandardResponse<CreateCheckoutSessionResponse>> {
    const trialSession = await this.paymentService.createTrialSession({
      userId: user.id,
      originUrl,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Trial session created',
      data: trialSession,
    };
  }

  // ================================================================
  //. Cancel subscription (disable auto-renewal)
  // ================================================================
  @Post('cancel')
  @UseGuards(ApiGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel (disable auto-renewal on) the active subscription',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Subscription cancellation scheduled — access continues until period end',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Subscription cancelled',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No active subscription found',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Subscription not found',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized!',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error!',
        data: null,
      },
    },
  })
  async cancelSubscription(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<null>> {
    await this.paymentService.cancelSubscription({ userId: user.id });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Subscription cancelled',
      data: null,
    };
  }

  // ================================================================
  //. Resume subscription (re-enable auto-renewal)
  // ================================================================
  @Post('resume')
  @UseGuards(ApiGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a previously cancelled subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auto-renewal re-enabled on the subscription',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Subscription resumed',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No subscription found to resume',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Subscription not found',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized!',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error!',
        data: null,
      },
    },
  })
  async resumeSubscription(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<null>> {
    await this.paymentService.resumeSubscription({ userId: user.id });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Subscription resumed',
      data: null,
    };
  }

  // ================================================================
  //. Webhook to handle paystack events
  // ================================================================
  @Post('webhook')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook to handle paystack events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook to handle paystack events',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Webhook to handle paystack events',
        data: null,
      },
    },
  })
  async handleWebhook(
    @RawBody() body: Buffer,
    @PaystackSig() signature: string,
  ): Promise<StandardResponse<null>> {
    await this.paymentService.handleWebhook(body, signature);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Webhook to handle paystack events',
      data: null,
    };
  }
}
