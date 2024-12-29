export const delayMiliseconds = async (s: number) => {
  return new Promise((res) => setTimeout(res, s));
};

