import { join } from 'node:path';
import 'dotenv/config';

// PROTO SETUP
import { AUTH_PACKAGE_NAME, protobufPackage as AUTH } from '@fintrack/types/protos/auth/auth';
import {
  PAYMENT_PACKAGE_NAME,
  protobufPackage as PAYMENT,
} from '@fintrack/types/protos/payment/payment';

type Service = 'API_GATEWAY' | 'AUTH_SERVICE' | 'PAYMENT_SERVICE';

interface IService {
  NAME: string;
  PACKAGE_NAME: string;
  DEFAULT_PORT: number;
  DEFAULT_HOST: string;
  PROTO_PATH: string;
}

export const getServiceConfig = (): Record<Service, IService> => ({
  API_GATEWAY: {
    NAME: 'API_GATEWAY',
    PACKAGE_NAME: 'API_GATEWAY',
    DEFAULT_PORT: 4001,
    DEFAULT_HOST: '0.0.0.0',
    PROTO_PATH: '',
  },
  AUTH_SERVICE: {
    NAME: AUTH,
    PACKAGE_NAME: AUTH_PACKAGE_NAME,
    DEFAULT_PORT: 4002,
    DEFAULT_HOST: '0.0.0.0',
    PROTO_PATH: join(process.cwd(), '..', '..', 'packages/types/proto/auth/auth.proto'),
  },
  PAYMENT_SERVICE: {
    NAME: PAYMENT,
    PACKAGE_NAME: PAYMENT_PACKAGE_NAME,
    DEFAULT_PORT: 4003,
    DEFAULT_HOST: '0.0.0.0',
    PROTO_PATH: join(process.cwd(), '..', '..', 'packages/types/proto/payment/payment.proto'),
  },
});

export function getServiceUrl(serviceName: keyof ReturnType<typeof getServiceConfig>): string {
  const config = getServiceConfig()[serviceName];
  // Convention: SERVICE_NAME_HOST (e.g. AUTH_SERVICE_HOST)
  const envHost = process.env[`${serviceName}_HOST`];
  const envPort = process.env[`${serviceName}_PORT`];

  const host = envHost || config.DEFAULT_HOST;
  const port = envPort || config.DEFAULT_PORT;
  return `${host}:${port}`;
}
