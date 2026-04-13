import * as crypto from 'crypto';

import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@fintrack/database/service';
import { Category, Prisma, User } from '@fintrack/database/types';
import { UsageService } from '../usage/usage.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

/**
 * CategoryService.
 */
@Injectable()
export class CategoryService {
  private logger = new Logger(CategoryService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usageService: UsageService,
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
   * @description Delete a category
   *
   * @param {string} slug - The slug of the category to delete
   * @param {User} user - The user deleting the category
   *
   * @async
   * @public
   * @returns {Promise<StandardResponse<Partial<Category>>>}
   */
  async deleteCategory(slug: string, user: User): Promise<void> {
    try {
      const categories = await this.prismaService.category.findMany({
        where: {
          OR: [
            {
              slug,
              userId: user.id,
              isSystem: false,
            },
            {
              slug: 'cat-misc',
              isSystem: true,
            },
          ],
        },
        select: {
          id: true,
          slug: true,
        },
      });
      if (categories.length < 2)
        throw new NotFoundException('Category not found');

      const misCategory = categories.find(
        (category) => category.slug === 'cat-misc',
      );
      if (!misCategory) throw new NotFoundException('Category not found');

      const deleteCategory = categories.find(
        (category) => category.slug === slug,
      );
      if (!deleteCategory) throw new NotFoundException('Category not found');

      await this.prismaService.$transaction([
        this.prismaService.transaction.updateMany({
          where: {
            categoryId: deleteCategory.id,
          },
          data: {
            categoryId: misCategory.id,
          },
        }),
        this.prismaService.category.delete({
          where: {
            id: deleteCategory.id,
          },
        }),
      ]);
      await this.usageService.invalidateGatedUsageCache(user.id);
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
