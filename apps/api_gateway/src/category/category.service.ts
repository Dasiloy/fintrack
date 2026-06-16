import * as crypto from 'crypto';

import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@fintrack/database/service';
import { Category, Prisma, User } from '@fintrack/database/types';
import { CountCatregoryLinkedItems } from '@fintrack/types/interfaces/category';
import { UsageService } from '../usage/usage.service';
import {
  CreateCategoryDto,
  DeleteCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';
import { BudgetService } from '../budget/budget.service';

/**
 * @description Manages user-defined and system transaction categories including CRUD operations and slug generation.
 *
 * ## Responsibilities
 * - Fetching system and user-owned categories
 * - Creating custom categories with unique crypto-derived slugs
 * - Updating and deleting user-owned categories; on delete, optionally reassigning linked transactions, recurring items, and budgets to a caller-chosen category (`switchCatSlug`) before removal, or returning `409` when items are linked and no target is given
 * - Invalidating the gated usage cache after category count changes
 *
 * ## Side effects
 * Create and delete operations call `UsageService.invalidateGatedUsageCache` to keep plan-limit counts accurate.
 *
 * @class CategoryService
 */
@Injectable()
export class CategoryService {
  private logger = new Logger(CategoryService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usageService: UsageService,
    private readonly budgetService: BudgetService,
  ) {}

  /**
   * @description Get the categories
   *
   * @async
   * @public
   * @returns {Promise<StandardResponse<Category[]>>}
   */
  async getCategories(user: User): Promise<Partial<Category>[]> {
    try {
      const categories = await this.prismaService.category.findMany({
        where: {
          OR: [
            {
              isSystem: true,
            },
            {
              userId: user.id,
            },
          ],
        },
        select: {
          name: true,
          slug: true,
          description: true,
          icon: true,
          color: true,
          isSystem: true,
          userId: true,
        },
      });

      return categories;
    } catch (error) {
      this.logger.error(`Categories fetch failed: ${error.message}`);
      throw new InternalServerErrorException('Categories fetch failed', error);
    }
  }

  /**
   * @description Create a category
   * Creet an internal unique slug for the category
   *
   * @param {User} user - The user creating the category
   * @param {CreateCategoryDto} createCategoryDto - The data for the category to create
   *
   * @async
   * @public
   * @returns {Promise<StandardResponse<Category>>}
   */
  async createCategory(
    user: User,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Partial<Category>> {
    try {
      const slug = this.generateSlug();
      const category = await this.prismaService.category.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description,
          color: createCategoryDto.color,
          userId: user.id,
          slug,
        },
        select: {
          name: true,
          slug: true,
          description: true,
          icon: true,
          color: true,
          isSystem: true,
          userId: true,
        },
      });
      await this.usageService.invalidateGatedUsageCache(user.id);
      return category;
    } catch (error) {
      this.logger.error(`Category create failed: ${error.message}`);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Category already exists');
      }
      throw new InternalServerErrorException('Category creation failed', error);
    }
  }

  /**
   * @description Update a category
   *
   * @param {User} user - The user updating the category
   * @param {UpdateCategoryDto} updateCategoryDto - The data for the category to update
   *
   * @async
   * @public
   * @returns {Promise<StandardResponse<Partial<Category>>>}
   */
  async updateCategory(
    slug: string,
    user: User,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Partial<Category>> {
    try {
      const category = await this.prismaService.category.findUnique({
        where: {
          slug,
          userId: user.id,
          isSystem: false,
        },
      });
      if (!category) throw new NotFoundException('Category not found');

      const newCategory = await this.prismaService.category.update({
        where: {
          id: category.id,
        },
        data: {
          name: updateCategoryDto.name,
          description: updateCategoryDto.description,
          color: updateCategoryDto.color,
        },
        select: {
          name: true,
          slug: true,
          description: true,
          icon: true,
          color: true,
          isSystem: true,
          userId: true,
        },
      });
      return newCategory;
    } catch (error) {
      this.logger.error(`Category update failed: ${error.message}`);
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Category already exists');
      }
      throw new InternalServerErrorException('Category update failed', error);
    }
  }

  /**
   * @description Get count of linked items to a category
   * System categories cannot be deleted
   *
   * @param {string} slug - The slug of the category
   * @param {User} user - The user who owns the category
   *
   * @async
   * @public
   * @returns {Promise<StandardResponse<Partial<CountCatregoryLinkedItems>>>}
   */
  async getCategoryLinkedItemsCount(
    slug: string,
    user: User,
  ): Promise<CountCatregoryLinkedItems> {
    try {
      const categorty = await this.prismaService.category.findFirst({
        where: {
          slug,
        },
        select: {
          id: true,
          name: true,
          userId: true,
          isSystem: true,
        },
      });

      if (!categorty) {
        throw new NotFoundException('Category not found');
      }

      if (categorty.isSystem) {
        throw new BadRequestException(
          `${categorty.name} is a system category and cannot be deleted`,
        );
      }

      if (categorty.userId !== user.id) {
        throw new NotFoundException('Category not found');
      }

      const counts = await this.prismaService.category.findFirst({
        where: {
          userId: user.id,
          isSystem: false,
          slug,
        },
        select: {
          _count: {
            select: {
              budgets: true,
              recurringItems: true,
              transactions: true,
            },
          },
        },
      });

      return {
        budgets: counts?._count.budgets ?? 0,
        recurringItems: counts?._count.recurringItems ?? 0,
        transactions: counts?._count.transactions ?? 0,
      };
    } catch (error) {
      this.logger.error(
        `Could not get category linked items count: ${error.message}`,
      );
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'An error ocuured, Please try again later',
        error,
      );
    }
  }

  /**
   * @description Delete a category
   *
   * @param {string} slug - The slug of the category to delete
   * @param {User} user - The user deleting the category
   *
   * @async
   * @public
   * @returns {Promise<StandardResponse<Partial<Category>>>}
   */
  async deleteCategory(
    slug: string,
    user: User,
    payload: DeleteCategoryDto,
  ): Promise<void> {
    try {
      const { switchCatSlug: switchToSlug } = payload ?? {};

      if (switchToSlug && switchToSlug === slug) {
        throw new BadRequestException(
          'You cannot move items to the category being deleted',
        );
      }

      // Fetch the base category and (optionally) the reassignment target in one
      // query. The base must be a user-owned, non-system category; the target
      // may be ANY category the user can use — including system categories like
      // Miscellaneous (`cat-misc`), which is the default reassignment target.
      const filters = [slug, switchToSlug].filter(Boolean) as string[];
      const categories = await this.prismaService.category.findMany({
        where: {
          slug: { in: filters },
          OR: [{ isSystem: true }, { userId: user.id }],
        },
        select: { id: true, slug: true, userId: true, isSystem: true },
      });
      const bySlug = new Map(categories.map((c) => [c.slug, c]));

      const baseCategory = bySlug.get(slug);
      if (!baseCategory || baseCategory.userId !== user.id) {
        throw new NotFoundException('Category to be deleted not found');
      }
      if (baseCategory.isSystem) {
        throw new BadRequestException('System categories cannot be deleted');
      }

      const switchToCategory = switchToSlug
        ? bySlug.get(switchToSlug)
        : undefined;
      if (switchToSlug && !switchToCategory) {
        throw new NotFoundException('Category to move items to not found');
      }

      if (!switchToCategory) {
        // No reassignment target. Only allowed when nothing is linked; otherwise
        // the client must pick where to move items (BL-007: 409 with counts).
        // Transaction.category is `onDelete: Restrict`, so a blind delete would
        // also fail at the DB anyway.
        const linked = await this.prismaService.category.findUnique({
          where: { id: baseCategory.id },
          select: {
            _count: {
              select: {
                budgets: true,
                recurringItems: true,
                transactions: true,
              },
            },
          },
        });
        const counts: CountCatregoryLinkedItems = {
          budgets: linked?._count.budgets ?? 0,
          recurringItems: linked?._count.recurringItems ?? 0,
          transactions: linked?._count.transactions ?? 0,
        };
        if (counts.budgets + counts.recurringItems + counts.transactions > 0) {
          throw new ConflictException({
            message:
              'This category is still in use. Choose a category to move its items to.',
            counts,
          });
        }

        await this.prismaService.category.delete({
          where: { id: baseCategory.id },
        });
      } else {
        await this.prismaService.$transaction(async (tx) => {
          // Move transactions first — the FK is Restrict, so they must be
          // reassigned before the category can be deleted.
          await tx.transaction.updateMany({
            where: { userId: user.id, categoryId: baseCategory.id },
            data: { categoryId: switchToCategory.id },
          });

          // Move recurring items.
          await tx.recurringItem.updateMany({
            where: { userId: user.id, categoryId: baseCategory.id },
            data: { categoryId: switchToCategory.id },
          });

          // Merge budgets. Budgets are unique per [userId, categoryId, period],
          // so a base budget can only be moved when the target has none for that
          // period. When the target already has one we fold the base amount into
          // it (additive — never create a duplicate) and drop the base budget.
          const baseBudgets = await tx.budget.findMany({
            where: { userId: user.id, categoryId: baseCategory.id },
          });

          for (const baseBudget of baseBudgets) {
            const targetBudget = await tx.budget.findFirst({
              where: {
                userId: user.id,
                categoryId: switchToCategory.id,
                period: baseBudget.period,
              },
            });

            if (!targetBudget) {
              await tx.budget.update({
                where: { id: baseBudget.id },
                data: { categoryId: switchToCategory.id },
              });
              continue;
            }

            const mergedAmount = targetBudget.amount + baseBudget.amount;
            await tx.budget.update({
              where: { id: targetBudget.id },
              data: { amount: mergedAmount },
            });
            // Keep the open history window (endDate = null) in sync with the
            // new limit so spending trends stay consistent.
            await tx.budgetHistory.updateMany({
              where: { budgetId: targetBudget.id, endDate: null },
              data: { limit: mergedAmount },
            });
            // Remove the base budget; its history cascades.
            await tx.budget.delete({ where: { id: baseBudget.id } });
          }

          // Finally remove the now-empty category.
          await tx.category.delete({ where: { id: baseCategory.id } });
        });
      }

      void this.usageService.invalidateGatedUsageCache(user.id);
      void this.budgetService.invalidateBudgetListAndTrend(user.id);
      void this.budgetService.invalidateExportCache(user.id);
    } catch (error) {
      this.logger.error(`Category delete failed: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Category deletion failed', error);
    }
  }
  /**
   * @description Generate a slug for the category
   * Slug is prefixed by cat-
   * And is 8 characters long
   *
   * @private
   * @returns {string} The slug for the category
   */
  private generateSlug(): string {
    return `cat-${crypto.randomBytes(8).toString('hex')}`;
  }
}
