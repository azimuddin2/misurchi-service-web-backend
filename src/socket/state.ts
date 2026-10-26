export const socketTOUserId = new Map<string, string>();
export const userTOSocketId = new Map<string, string>();
export const onlineUser = new Set();

export function getSocketId(userid: string) {
  return userTOSocketId.get(userid?.toString()) as string;
}
