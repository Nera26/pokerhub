import { Controller, Get, Inject, Type } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface RouteMetadata {
  /** Base path for the controller */
  path: string;
  /** Swagger tag */
  tag: string;
  /** Summary for Swagger */
  summary: string;
  /** Description for Swagger */
  description: string;
}

export function createListController<
  S extends { list(): Promise<unknown> },
  T = Awaited<ReturnType<S['list']>>,
  R = T,
>(metadata: RouteMetadata, Service: Type<S>, transform?: (data: T) => R) {
  @ApiTags(metadata.tag)
  @Controller(metadata.path)
  class ListController {
    constructor(@Inject(Service) private readonly service: S) {}

    @Get()
    @ApiOperation({ summary: metadata.summary })
    @ApiResponse({ status: 200, description: metadata.description })
    async list(): Promise<R> {
      const data = (await this.service.list()) as T;
      return transform ? transform(data) : data;
    }
  }

  return ListController;
}
