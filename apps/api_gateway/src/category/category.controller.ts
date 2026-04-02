import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CategoryService } from './category.service';
import { ApiGuard } from '../guards/api.guard';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';
import { CurrentUser } from '../decorators/current_user.decorator';
import { Category, User } from '@fintrack/database/types';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

/**
 * Controller responsible for managing category related operations
 * Handles HTTP requests for CRUD operations on categories
 *
 * @class CategoryController
 */
@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(ApiGuard)
@Controller({
  path: 'category',
})
/**
 * CategoryController.
 */
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // ================================================================
  //. Get Categories
  // ================================================================
  @Get('')
  @ApiOperation({
    summary: 'Get Categories',
    description: 'Get the categories',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        data: [
          {
            name: 'Food',
            slug: 'cat-food',
            description: null,
            icon: null,
            color: '#F97316',
            isSystem: true,
            userId: null,
          },
          {
            name: 'Transport',
            slug: 'cat-transport',
            description: null,
            icon: null,
            color: '#3B82F6',
            isSystem: true,
            userId: null,
          },
        ],
        message: 'Categories fetched successfully',
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
        data: null,
        message: 'Unauthorized',
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
        data: null,
        message: 'Internal server error',
      },
    },
  })
  async getDocs(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<Partial<Category>[]>> {
    const categories = await this.categoryService.getCategories(user);
    return {
      success: true,
      data: categories,
      statusCode: HttpStatus.OK,
      message: 'Categories fetched successfully',
    };
  }

  // ================================================================
  //. Create a Category
  // ================================================================
  @Post('')
  @ApiOperation({
    summary: 'Create a Category',
    description: 'Create a new category',
  })
  @ApiBody({
    description: 'Payload for creating a category',
    required: true,
    type: CreateCategoryDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        data: {
          name: 'Food',
          slug: 'cat-food',
          description: null,
          icon: null,
          color: '#F97316',
          isSystem: true,
          userId: null,
        },
        message: 'Category created successfully',
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
        data: null,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Category already exists',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Category already exists',
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
        data: null,
        message: 'Internal server error',
      },
    },
  })
  @ApiBody({
    type: CreateCategoryDto,
  })
  async createCategory(
    @CurrentUser() user: User,
    @Body() body: CreateCategoryDto,
  ): Promise<StandardResponse<Partial<Category>>> {
    const category = await this.categoryService.createCategory(user, body);
    return {
      success: true,
      data: category,
      statusCode: HttpStatus.CREATED,
      message: 'Category created successfully',
    };
  }

  // ================================================================
  //. Update a Category
  // ================================================================
  @Patch(':slug')
  @ApiOperation({
    summary: 'Update a Category',
    description: 'Update an existing category',
  })
  @ApiBody({
    description: 'Payload for updating a category',
    required: true,
    type: UpdateCategoryDto,
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug of the category to update',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        data: {
          name: 'Food',
          slug: 'cat-food',
          description: null,
          icon: null,
          color: '#F97316',
          isSystem: true,
          userId: null,
        },
        message: 'Category updated successfully',
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
        data: null,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
        message: 'Category not found',
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
        data: null,
        message: 'Internal server error',
      },
    },
  })
  async updateCategory(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: UpdateCategoryDto,
  ): Promise<StandardResponse<Partial<Category>>> {
    const category = await this.categoryService.updateCategory(
      slug,
      user,
      body,
    );
    return {
      success: true,
      data: category,
      statusCode: HttpStatus.OK,
      message: 'Category updated successfully',
    };
  }

  // ================================================================
  //. Delete a Category
  // ================================================================
  @Delete(':slug')
  @ApiOperation({
    summary: 'Delete a Category',
    description: 'Delete an existing category',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug of the category to delete',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        data: null,
        message: 'Category deleted successfully',
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
        data: null,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
        message: 'Category not found',
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
        data: null,
        message: 'Internal server error',
      },
    },
  })
  async deleteCategory(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
  ): Promise<StandardResponse<null>> {
    await this.categoryService.deleteCategory(slug, user);
    return {
      success: true,
      data: null,
      statusCode: HttpStatus.OK,
      message: 'Category deleted successfully',
    };
  }
}
