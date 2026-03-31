import { join } from 'node:path';
import 'dotenv/config';

// PROTO SETUP
import { AUTH_PACKAGE_NAME, protobufPackage as AUTH } from '@fintrack/types/protos/auth/auth';
import {
  PAYMENT_PACKAGE_NAME,
  protobufPackage as PAYMENT,
} from '@fintrack/types/protos/payment/payment';
import {
  NOTIFICATION_PACKAGE_NAME,
  protobufPackage as NOTIFICATION,
} from '@fintrack/types/protos/notification/notification';
import { AI_PACKAGE_NAME, protobufPackage as AI } from '@fintrack/types/protos/ai/ai';
import {
  FINANCE_PACKAGE_NAME,
  protobufPackage as FINANCE,
} from '@fintrack/types/protos/finance/finance';
import {
  SCHEDULER_PACKAGE_NAME,
  protobufPackage as SCHEDULER,
} from '@fintrack/types/protos/scheduler/scheduler';

export type Service =
  | 'API_GATEWAY'
  | 'AUTH_SERVICE'
  | 'PAYMENT_SERVICE'
  | 'NOTIFICATION_SERVICE'
  | 'AI_SERVICE'
  | 'FINANCE_SERVICE'
  | 'SCHEDULER_SERVICE';

interface IService {
  NAME: string;
  PACKAGE_NAME: string;
  PROTO_PATH: string[];
}

export const getProtoIncludeDirs = (): string[] => [
  join(process.cwd(), '..', '..', 'packages/types/proto'),
];

export const getServiceConfig = (): Record<Service, IService> => ({
  API_GATEWAY: {
    NAME: 'API_GATEWAY',
    PACKAGE_NAME: 'API_GATEWAY',
    PROTO_PATH: [],
  },
  AUTH_SERVICE: {
    NAME: AUTH,
    PACKAGE_NAME: AUTH_PACKAGE_NAME,
    PROTO_PATH: [join(process.cwd(), '..', '..', 'packages/types/proto/auth/auth.proto')],
  },
  PAYMENT_SERVICE: {
    NAME: PAYMENT,
    PACKAGE_NAME: PAYMENT_PACKAGE_NAME,
    PROTO_PATH: [join(process.cwd(), '..', '..', 'packages/types/proto/payment/payment.proto')],
  },
  NOTIFICATION_SERVICE: {
    NAME: NOTIFICATION,
    PACKAGE_NAME: NOTIFICATION_PACKAGE_NAME,
    PROTO_PATH: [
      join(process.cwd(), '..', '..', 'packages/types/proto/notification/notification.proto'),
    ],
  },
  AI_SERVICE: {
    NAME: AI,
    PACKAGE_NAME: AI_PACKAGE_NAME,
    PROTO_PATH: [join(process.cwd(), '..', '..', 'packages/types/proto/ai/ai.proto')],
  },
  FINANCE_SERVICE: {
    NAME: FINANCE,
    PACKAGE_NAME: FINANCE_PACKAGE_NAME,
    PROTO_PATH: [join(process.cwd(), '..', '..', 'packages/types/proto/finance/finance.proto')],
  },
  SCHEDULER_SERVICE: {
    NAME: SCHEDULER,
    PACKAGE_NAME: SCHEDULER_PACKAGE_NAME,
    PROTO_PATH: [join(process.cwd(), '..', '..', 'packages/types/proto/scheduler/scheduler.proto')],
  },
});

export function getServiceUrl(serviceName: keyof ReturnType<typeof getServiceConfig>): string {
  const config = getServiceConfig()[serviceName];
  // Convention: SERVICE_NAME_HOST (e.g. AUTH_SERVICE_HOST)
  const envHost = process.env[`${serviceName}_HOST`];
  const envPort = process.env[`${serviceName}_PORT`];

  const host = envHost;
  const port = envPort;
  return `${host}:${port}`;
}
