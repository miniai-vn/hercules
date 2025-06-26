import dayjs from 'dayjs';

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const isAfter = (
  timestamp: number,
  amount: number,
  unit: dayjs.ManipulateType,
  isMilliseconds: boolean = false,
): boolean => {
  const targetTime = dayjs().subtract(amount, unit);
  const messageTime = isMilliseconds ? dayjs(timestamp) : dayjs.unix(timestamp);
  return messageTime.isAfter(targetTime);
};

export { delay, isAfter };
