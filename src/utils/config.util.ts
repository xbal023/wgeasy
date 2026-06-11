import { prisma } from '../db/client';

export const getDynamicConfig = async (key: string, defaultValue: string): Promise<string> => {
  const config = await prisma.botConfig.findUnique({ where: { key } });
  return config?.value ?? defaultValue;
};
