import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { Currency, DateFormat, Language } from '@fintrack/database/types';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({ enum: Language })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ enum: DateFormat })
  @IsOptional()
  @IsEnum(DateFormat)
  dateFormat?: DateFormat;

  @ApiPropertyOptional({ example: 'Africa/Lagos' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() budgetAlertMail?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() budgetAlertApp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() billReminderMail?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() billReminderApp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() weeklyReportMail?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() weeklyReportApp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() aiInsightsMail?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() aiInsightsApp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() goalsAlertMail?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() goalsAlertApp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() splitsAlertMail?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() splitsAlertApp?: boolean;
}
