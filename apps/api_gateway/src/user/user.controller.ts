import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '@fintrack/database/types';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';
import { UserService, UserProfile } from './user.service';
import { UpdateMeDto, UpdateSettingsDto } from './dto/user.dto';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(ApiGuard)
@Controller({ path: 'user' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile', description: 'Cached in Redis for 5 minutes.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile fetched successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: User): Promise<StandardResponse<UserProfile>> {
    const data = await this.userService.getMe(user.id);
    return {
      success: true,
      data,
      statusCode: HttpStatus.OK,
      message: 'Profile fetched successfully',
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateMeDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() body: UpdateMeDto,
  ): Promise<StandardResponse<UserProfile>> {
    const data = await this.userService.updateMe(user, body);
    return {
      success: true,
      data,
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
    };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiBody({ type: UpdateSettingsDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Settings updated successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async updateSettings(
    @CurrentUser() user: User,
    @Body() body: UpdateSettingsDto,
  ): Promise<StandardResponse<null>> {
    await this.userService.updateSettings(user.id, body);
    return {
      success: true,
      data: null,
      statusCode: HttpStatus.OK,
      message: 'Settings updated successfully',
    };
  }
}
