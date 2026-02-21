import dayjs from 'dayjs';

import relativeTime from 'dayjs/plugin/relativeTime.js';
dayjs.extend(relativeTime);

export const getTimeFromNowInMinutes = (date: Date) => {
  return dayjs(date).diff(dayjs(), 'minute');
};

export default dayjs;
