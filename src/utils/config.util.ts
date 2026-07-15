import { prisma } from '../db/client';

export const getDynamicConfig = async (key: string, defaultValue: string): Promise<string> => {
  const config = await prisma.botConfig.findUnique({ where: { key } });
  return config?.value ?? defaultValue;
};

export const setDynamicConfig = async (key: string, value: string): Promise<void> => {
  await prisma.botConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
};
