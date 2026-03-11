-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('AFN', 'EUR', 'ALL', 'DZD', 'USD', 'AOA', 'XCD', 'ARS', 'AMD', 'AWG', 'AUD', 'AZN', 'BSD', 'BHD', 'BDT', 'BBD', 'BYN', 'BZD', 'XOF', 'BMD', 'INR', 'BTN', 'BOB', 'BOV', 'BAM', 'BWP', 'NOK', 'BRL', 'BND', 'BGN', 'BIF', 'CVE', 'KHR', 'XAF', 'CAD', 'KYD', 'CLP', 'CLF', 'CNY', 'COP', 'COU', 'KMF', 'CDF', 'NZD', 'CRC', 'HRK', 'CUP', 'CUC', 'ANG', 'CZK', 'DKK', 'DJF', 'DOP', 'EGP', 'SVC', 'ERN', 'ETB', 'FKP', 'FJD', 'XPF', 'GMD', 'GEL', 'GHS', 'GIP', 'GTQ', 'GBP', 'GNF', 'GYD', 'HTG', 'HNL', 'HKD', 'HUF', 'ISK', 'IDR', 'XDR', 'IRR', 'IQD', 'ILS', 'JMD', 'JPY', 'JOD', 'KZT', 'KES', 'KPW', 'KRW', 'KWD', 'KGS', 'LAK', 'LBP', 'LSL', 'ZAR', 'LRD', 'LYD', 'CHF', 'MOP', 'MKD', 'MGA', 'MWK', 'MYR', 'MVR', 'MUR', 'XUA', 'MXN', 'MXV', 'MDL', 'MNT', 'MAD', 'MZN', 'MMK', 'NAD', 'NPR', 'NIO', 'NGN', 'OMR', 'PKR', 'PAB', 'PGK', 'PYG', 'PEN', 'PHP', 'PLN', 'QAR', 'RON', 'RUB', 'RWF', 'SHP', 'WST', 'STN', 'SAR', 'RSD', 'SCR', 'SLL', 'SGD', 'XSU', 'SBD', 'SOS', 'SSP', 'LKR', 'SDG', 'SRD', 'SZL', 'SEK', 'CHE', 'CHW', 'SYP', 'TWD', 'TJS', 'TZS', 'THB', 'TOP', 'TTD', 'TND', 'TRY', 'TMT', 'UGX', 'UAH', 'AED', 'USN', 'UYU', 'UYI', 'UYW', 'UZS', 'VUV', 'VES', 'VND', 'XBA', 'XBB', 'XBC', 'XBD', 'XTS', 'XXX', 'XAU', 'XPD', 'XPT', 'XAG', 'ZMW', 'ZWL');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'FR', 'ES', 'PT', 'EN_US', 'EN_GB', 'HA_LATN_NG', 'YO_NG', 'IG_NG', 'SW_KE', 'SW_TZ');

-- CreateEnum
CREATE TYPE "DateFormat" AS ENUM ('DMY', 'MDY', 'YMD');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NGN',
ADD COLUMN     "dateFormat" "DateFormat" NOT NULL DEFAULT 'DMY',
ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'EN_US',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos';

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "budgetAlertMail" BOOLEAN NOT NULL DEFAULT true,
    "budgetAlertApp" BOOLEAN NOT NULL DEFAULT true,
    "billReminderMail" BOOLEAN NOT NULL DEFAULT true,
    "billReminderApp" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReportMail" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReportApp" BOOLEAN NOT NULL DEFAULT true,
    "aiInsightsMail" BOOLEAN NOT NULL DEFAULT true,
    "aiInsightsApp" BOOLEAN NOT NULL DEFAULT true,
    "goalsAlertMail" BOOLEAN NOT NULL DEFAULT true,
    "gaolsAlertApp" BOOLEAN NOT NULL DEFAULT true,
    "splitsAlertMail" BOOLEAN NOT NULL DEFAULT true,
    "splitsAlertApp" BOOLEAN NOT NULL DEFAULT true,
    "newsLetterAlert" BOOLEAN NOT NULL DEFAULT false,
    "communityAlert" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");

-- AddForeignKey
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
