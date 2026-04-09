import { status } from '@grpc/grpc-js';

import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '@fintrack/database/service';
import { Category, Prisma } from '@fintrack/database/types';
import { Category as ProtoCategory } from '@fintrack/types/protos/finance/transaction';

/**
 *  Utils Helpers specificially for reusable logics and mthods
 *
 * @class
 */
@Injectable()
export class UtilsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * @description Get a category by id
   *
   * @public
   * @param userId - The user id
   * @param categoryId - The category id
   * @returns The category
   */
  async getCategory(userId: string, slug: string): Promise<Partial<Category>> {
    try {
      const category = await this.prismaService.category.findFirstOrThrow({
        where: {
          OR: [
            {
              slug,
              userId,
              isSystem: false,
            },
            {
              slug,
              isSystem: true,
            },
          ],
        },
        select: {
          id: true,
        },
      });
      return category;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Category not found',
        });
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured',
        details: error.message,
      });
    }
  }

  /**
   * @description Format prisma category into standard proto category
   *
   * @public
   * @param {Category} category The Category to be formatted
   * @returns {ProtoCategory} The standard proto category formatted response
   */
  formatCategory(category?: Category | null): ProtoCategory | undefined {
    return category
      ? {
          name: category.name,
          slug: category.slug,
          color: category.color ?? '',
          icon: category.icon ?? '',
        }
      : undefined;
  }
}
