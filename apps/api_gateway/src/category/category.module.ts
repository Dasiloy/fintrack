import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { UsageModule } from '../usage/usage.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [UsageModule, BudgetModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
