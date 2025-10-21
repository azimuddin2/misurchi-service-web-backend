export const generateTrxId = (): string => {
  // Example: TXN20251020A9F43B
  const prefix = 'TXN';
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${datePart}${randomPart}`;
};
