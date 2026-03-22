import {
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
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
import { StripeSig } from '../decorators/stripe_decorator';

import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';
import { OriginUrl } from '../decorators/origin_decorator';

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
export class PaymentController {
  private readonly logger = new Logger();
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
            'https://checkout.stripe.com/c/checkout/session/cs_test_a1234567890',
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
          portalSessionUrl:
            'https://portal.stripe.com/p/session/cs_test_a1234567890',
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
  ): Promise<StandardResponse<CreatePortalSessionResponse>> {
    const portalSession = await this.paymentService.createPortalSession({
      userId: user.id,
      originUrl,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Portal session created',
      data: portalSession,
    };
  }
  // ================================================================
  //. Webhook to handle stripe events
  // ================================================================
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook to handle stripe events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook to handle stripe events',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Webhook to handle stripe events',
        data: null,
      },
    },
  })
  async handleWebhook(
    @RawBody() body: Buffer,
    @StripeSig() signature: string,
  ): Promise<StandardResponse<null>> {
    await this.paymentService.handleWebhook(body, signature);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Webhook to handle stripe events',
      data: null,
    };
  }
}
