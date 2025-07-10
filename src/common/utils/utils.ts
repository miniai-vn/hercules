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

// generate random unique with characters
const generateRandomUnique = (length: number): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

export { delay, isAfter };
