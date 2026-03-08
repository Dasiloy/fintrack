import { Request } from 'express';
import { DeviceInfo } from '@fintrack/types/interfaces/device';

export type RequestWithDevice = Request & { deviceInfo: DeviceInfo };
