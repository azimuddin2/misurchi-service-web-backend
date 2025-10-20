export const generateOrderId = (): string => {
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // 1000-9999
  return `#ORD-${randomNumber}`;
};
