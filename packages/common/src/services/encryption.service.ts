import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type MonoBankAccount } from '@fintrack/database/types';

import {
  BankEncryptionFields,
  BankEncryptionFieldsWiithId,
} from '@fintrack/types/interfaces/banks';

/**
 * @class EncryptionService
 */
@Injectable()
export class EncryptionService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * @description Encrypt text using AES
   *
   * @public
   * @param {string} text Plain text string to encrypt => Symmetrically using AES
   * @returns {string} encrypted text and the iv text: encrypted:iv
   */
  encrypt(text: string): string {
    // secrets
    const secretStr = this.configService.getOrThrow('AES_KEY');
    const secretBuffer = Buffer.from(secretStr, 'hex');

    // random init vector
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', secretBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()]);

    return `${encrypted.toString('hex')}:${iv.toString('hex')}`;
  }

  /**
   * @description Dencrypt encrypted text using AES
   *
   * @public
   * @param {string} text encrypted text containing text:iv
   * @returns {string} plains text
   */
  decrypt(text: string): string {
    // secrets
    const secretStr = this.configService.getOrThrow('AES_KEY');
    const secretBuffer = Buffer.from(secretStr, 'hex');

    // random init vector
    const [encrypt, iv] = text.split(':');

    if (!encrypt || !iv) {
      throw new Error('Decryption Failed');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', secretBuffer, Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypt!, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf-8');
  }

  /**
   * @description Decrypt Account Related fields to be stored at rest
   *
   * @public
   * @param {Array<MonoBankAccount>} bankAccounts to be decrypted
   * @returns {Array<BankEncryptionFieldsWiithId>}
   */
  getMonoAccountEncryptionFields(bankAccounts: MonoBankAccount[]): BankEncryptionFieldsWiithId[] {
    if (bankAccounts.length === 0) return [];

    return bankAccounts.map((ba) => {
      const encryptionFields: BankEncryptionFields = {
        accountBalance: this.decrypt(ba.accountBalance),
        accountName: this.decrypt(ba.accountName),
        accountNumber: this.decrypt(ba.accountNumber),
        accountType: this.decrypt(ba.accountType),
      };

      return { ...encryptionFields, id: ba.id };
    });
  }

  /**
   * @description Encrypt Account Related fields to be stored at rest
   *
   * @public
   * @param {Array<BankEncryptionFields>} fields to be encrypted
   * @returns {Array<BankEncryptionFields>}
   */
  setMonoAccountEncryptionFields(fields: BankEncryptionFields[]): BankEncryptionFields[] {
    if (fields.length === 0) return [];

    return fields.map((ba) => {
      const encryptionFields: BankEncryptionFields = {
        accountBalance: this.encrypt(ba.accountBalance),
        accountName: this.encrypt(ba.accountName),
        accountNumber: this.encrypt(ba.accountNumber),
        accountType: this.encrypt(ba.accountType),
      };

      return encryptionFields;
    });
  }
}
