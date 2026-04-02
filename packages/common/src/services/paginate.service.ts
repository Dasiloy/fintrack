import { Injectable } from '@nestjs/common';

import { PaginateDto, PaginateResponse } from '@fintrack/types/interfaces/server_response';

/**
 * PaginateService
 * Service for paginating data
 *
 * @class PaginateService
 */
@Injectable()
export class PaginateService {
  /**
   * Paginate data
   *
   * @param {PaginateDto} paginate - The paginate object
   * @returns {PaginateResponse} The paginate response
   */
  paginate(paginate: PaginateDto): PaginateResponse {
    return {
      page: paginate.page,
      limit: paginate.limit,
      total: paginate.total,
      pageSize: paginate.pageSize,
      lastPage: Math.ceil(paginate.total / paginate.limit),
    };
  }
}
