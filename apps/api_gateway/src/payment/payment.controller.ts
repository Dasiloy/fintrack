import { Body, Controller, HttpStatus, Logger, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { PaymentService } from './payment.service';
import { SubscribeDto } from './dtos/subscribe.dto';

/**
 * Controller responsible for managing user payment and subscriptions
 * Handles HTTP requests for CRUD operations on payment and subscriptions
 *
 * @class PaymentController
 */
@ApiTags('Payments')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuards)
@Controller({
  version: '1',
  path: 'payment',
})
export class PaymentController {
  private readonly logger = new Logger();
  constructor(private readonly paymentService: PaymentService) {}

  // ================================================================
  //. Subscribe To a Paid Plan
  // ================================================================
  @Post()
  @ApiOperation({
    summary: 'Subscribe User',
    description:
      'subscribe a user to a paid plan that provides extras such as pdf generation of reports',
  })
  @ApiBody({
    description: 'Payload for subscribing',
    required: true,
    type: SubscribeDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successful payment subscription',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        data: null,
        message: 'Payment successful',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unathorized!',
  })
  async subscribe(
    @Body() _body: SubscribeDto,
  ): Promise<StandardResponse<null>> {
    await this.paymentService.subscribe();

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Payment successful',
    };
  }
}
