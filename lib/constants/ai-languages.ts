export type AILanguage =
  | 'Serbian'
  | 'English'
  | 'Croatian'
  | 'Bosnian'
  | 'Macedonian';

export const AI_LANGUAGE_OPTIONS: { value: AILanguage; label: string }[] = [
  { value: 'Serbian', label: 'Srpski' },
  { value: 'English', label: 'English' },
  { value: 'Croatian', label: 'Hrvatski' },
  { value: 'Bosnian', label: 'Bosanski' },
  { value: 'Macedonian', label: 'Makedonski' },
];

export const DEFAULT_AI_LANGUAGE: AILanguage = 'Serbian';

/**
 * Returns the language instruction string for AI prompts.
 * Used in hook, body, and CTA generators to tell the model which language to output.
 */
export function getLanguageInstruction(
  language: AILanguage | string | null | undefined
): string {
  const lang = language || DEFAULT_AI_LANGUAGE;
  switch (lang) {
    case 'English':
      return 'English. Use conversational, direct addressing (you/your).';
    case 'Croatian':
      return 'Croatian (Latin script). Use the informal "Ti" (You).';
    case 'Bosnian':
      return 'Bosnian (Latin script). Use the informal "Ti" (You).';
    case 'Macedonian':
      return 'Macedonian (Cyrillic script). Use informal addressing.';
    case 'Serbian':
    default:
      return 'Serbian (Latin script). Use the informal "Ti" (You).';
  }
}

/**
 * Returns the language name for prompt use (e.g. "SERBIAN", "ENGLISH").
 */
export function getLanguageNameForPrompt(
  language: AILanguage | string | null | undefined
): string {
  const lang = language || DEFAULT_AI_LANGUAGE;
  return lang.toUpperCase();
}
