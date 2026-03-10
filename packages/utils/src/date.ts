import dayjs from 'dayjs';

import relativeTime from 'dayjs/plugin/relativeTime.js';
dayjs.extend(relativeTime);

/**
 * @description Get elapsed time differemce between a specific date and now
 *
 * @param {Date} date
 * @returns {number} mionuites from now to date
 */
export const getTimeFromNowInMinutes = (date: Date): number => {
  return dayjs(date).diff(dayjs(), 'minute');
};

/**
 * @description Get elapsed time differemce between a specific date and now
 *
 * @param {Date} date
 * @returns {string} returns the diff as a formated string
 */
export const getTimeFromNow = (date: Date) => {
  return dayjs(date).fromNow();
};

/**
 * @description Get the start and end date between a month range in utc format
 *
 * @returns {[Date,Date]} returns [start,end] dates in utc
 */
export const getPeriodRange = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return [start, end] as [Date, Date];
};

export default dayjs;
