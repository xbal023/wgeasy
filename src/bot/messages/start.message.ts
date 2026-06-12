import { config } from "../../config";
import { TranslationKey } from "../../i18n";

export const buildStartMessage = (t: (key: TranslationKey, params?: any) => string, name: string) => {
  return t('start_welcome', { botName: config.BOT_NAME, greeting: t('start_greeting', { name }) });
};

export const buildGateMessage = (t: (key: TranslationKey, params?: any) => string, chatName: string) => {
  return t('gate_message', { chatName });
};
