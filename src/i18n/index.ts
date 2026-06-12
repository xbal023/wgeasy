import { id } from './id';
import { en } from './en';

export const dictionaries = { id, en };
export type Language = keyof typeof dictionaries;
export type TranslationKey = keyof typeof id;

export function t(lang: string, key: TranslationKey, params?: Record<string, string | number>): string {
  const language = (['id', 'en'].includes(lang) ? lang : 'id') as Language;
  let text = dictionaries[language][key] || dictionaries['id'][key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
    }
  }

  return text;
}
