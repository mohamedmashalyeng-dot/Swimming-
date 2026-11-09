import ar from "./ar";
import en, { type Dictionary } from "./en";
import type { Locale } from "../types";

const dictionaries: Record<Locale, Dictionary> = { ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? ar;
}
export type { Dictionary };
