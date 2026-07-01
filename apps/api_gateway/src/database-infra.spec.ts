import { MODULE_METADATA } from '@nestjs/common/constants';

const REDIS_CLIENT = 'REDIS_CLIENT';
const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';

jest.mock('@fintrack/types/constants/redis.costants', () => ({
  REDIS_CLIENT,
  REDIS_SUBSCRIBER,
}));

jest.mock(
  '../../../packages/database/src/service.js',
  () => {
    class PrismaService {}
    return { PrismaService };
  },
  { virtual: true },
);

jest.mock(
  '../../../packages/database/src/redis.js',
  () => ({
    redisProvider: { provide: REDIS_CLIENT },
    redisSubscriberProvider: { provide: REDIS_SUBSCRIBER },
  }),
  { virtual: true },
);

const { PrismaModule, RedisModule, RedisSubscriberModule } = jest.requireActual(
  '../../../packages/database/src/module',
) as typeof import('../../../packages/database/src/module');
const { PrismaService } = jest.requireMock(
  '../../../packages/database/src/service.js',
) as typeof import('../../../packages/database/src/service');

function providersOf(module: object): unknown[] {
  return Reflect.getMetadata(MODULE_METADATA.PROVIDERS, module) ?? [];
}

function exportsOf(module: object): unknown[] {
  return Reflect.getMetadata(MODULE_METADATA.EXPORTS, module) ?? [];
}

describe('database infrastructure modules', () => {
  it('keeps Prisma, Redis client, and Redis subscriber in separate modules', () => {
    expect(providersOf(PrismaModule)).toEqual([PrismaService]);
    expect(exportsOf(PrismaModule)).toEqual([PrismaService]);

    expect(providersOf(RedisModule)).toEqual([
      expect.objectContaining({ provide: REDIS_CLIENT }),
    ]);
    expect(exportsOf(RedisModule)).toEqual([REDIS_CLIENT]);

    expect(providersOf(RedisSubscriberModule)).toEqual([
      expect.objectContaining({ provide: REDIS_SUBSCRIBER }),
    ]);
    expect(exportsOf(RedisSubscriberModule)).toEqual([REDIS_SUBSCRIBER]);
  });
});
