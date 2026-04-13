import dayjs from 'dayjs';

import isToday from 'dayjs/plugin/isToday.js';
import isYesterday from 'dayjs/plugin/isYesterday.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

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

export const format = (date: Date | string, format: string) => {
  const dayjsDate = dayjs(date);
  return dayjsDate.isValid() ? dayjsDate.format(format) : '';
};

export const isDateToday = (date: Date | string) => {
  return dayjs(date).isToday();
};

export const isDateYesterday = (date: Date | string) => {
  return dayjs(date).isYesterday();
};

export const isDateThisWeek = (date: Date | string) => {
  const dayjsDate = dayjs(date);
  return dayjsDate.week() === dayjs().week() && dayjsDate.year() === dayjs().year();
};

export const isDateThisWeekIso = (date: Date | string) => {
  const dayjsDate = dayjs(date);
  return dayjsDate.isoWeek() === dayjs().isoWeek() && dayjsDate.year() === dayjs().year();
};

export default dayjs;
