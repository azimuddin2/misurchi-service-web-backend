export const generateStrongPassword = (): string => {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%&';

  const all = lower + upper + numbers + special;

  return (
    lower[Math.floor(Math.random() * lower.length)] +
    upper[Math.floor(Math.random() * upper.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)] +
    Array.from({ length: 4 })
      .map(() => all[Math.floor(Math.random() * all.length)])
      .join('')
  );
};
