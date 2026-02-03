/**
 * Multilingual Questionnaire Schema
 * 
 * This file defines the structure for questionnaires that support multiple languages.
 * Each questionnaire has a primary language and can have translations in other languages.
 * 
 * The schema supports:
 * - Translatable section titles and descriptions
 * - Translatable question text
 * - Translatable options for choice-based questions
 * - Translatable scale labels
 */

export type SupportedLanguage = 'en' | 'de';

export interface TranslatableText {
  [language: string]: string;
}

export interface TranslatableOptions {
  [language: string]: string[];
}

export interface TranslatableScale {
  min: number;
  max: number;
  minLabel: TranslatableText;
  maxLabel: TranslatableText;
}

export interface MultilingualQuestion {
  id: string;
  text: TranslatableText; // Question text in different languages
  type: 'scale' | 'single-choice' | 'multiple-choice' | 'ranking' | 'free-text';
  required?: boolean;
  scale?: TranslatableScale; // For scale questions
  options?: TranslatableOptions; // For choice-based questions
  maxLength?: number; // For free-text questions
}

export interface MultilingualSection {
  id: string;
  title: TranslatableText; // Section title in different languages
  description?: TranslatableText; // Section description in different languages
  questions: MultilingualQuestion[];
}

export interface MultilingualQuestionnaireSchema {
  sections: MultilingualSection[];
  primaryLanguage: SupportedLanguage;
  availableLanguages: SupportedLanguage[];
}

/**
 * Helper function to get text in a specific language with fallback
 */
export function getTranslatedText(
  text: TranslatableText,
  language: SupportedLanguage,
  fallbackLanguage: SupportedLanguage = 'en'
): string {
  return text[language] || text[fallbackLanguage] || Object.values(text)[0] || '';
}

/**
 * Helper function to get options in a specific language with fallback
 */
export function getTranslatedOptions(
  options: TranslatableOptions,
  language: SupportedLanguage,
  fallbackLanguage: SupportedLanguage = 'en'
): string[] {
  return options[language] || options[fallbackLanguage] || Object.values(options)[0] || [];
}

/**
 * Helper function to get scale labels in a specific language with fallback
 */
export function getTranslatedScale(
  scale: TranslatableScale,
  language: SupportedLanguage,
  fallbackLanguage: SupportedLanguage = 'en'
): { min: number; max: number; minLabel: string; maxLabel: string } {
  return {
    min: scale.min,
    max: scale.max,
    minLabel: getTranslatedText(scale.minLabel, language, fallbackLanguage),
    maxLabel: getTranslatedText(scale.maxLabel, language, fallbackLanguage),
  };
}

/**
 * Convert a multilingual schema to a single-language schema for display
 */
export function getLocalizedSchema(
  schema: MultilingualQuestionnaireSchema,
  language: SupportedLanguage
) {
  return {
    sections: schema.sections.map(section => ({
      id: section.id,
      title: getTranslatedText(section.title, language, schema.primaryLanguage),
      description: section.description 
        ? getTranslatedText(section.description, language, schema.primaryLanguage)
        : undefined,
      questions: section.questions.map(question => ({
        id: question.id,
        text: getTranslatedText(question.text, language, schema.primaryLanguage),
        type: question.type,
        required: question.required,
        scale: question.scale 
          ? getTranslatedScale(question.scale, language, schema.primaryLanguage)
          : undefined,
        options: question.options
          ? getTranslatedOptions(question.options, language, schema.primaryLanguage)
          : undefined,
        maxLength: question.maxLength,
      })),
    })),
  };
}

/**
 * Create an empty multilingual schema with a primary language
 */
export function createEmptyMultilingualSchema(
  primaryLanguage: SupportedLanguage = 'en'
): MultilingualQuestionnaireSchema {
  return {
    sections: [],
    primaryLanguage,
    availableLanguages: [primaryLanguage],
  };
}

/**
 * Add a new language to an existing schema
 */
export function addLanguageToSchema(
  schema: MultilingualQuestionnaireSchema,
  newLanguage: SupportedLanguage
): MultilingualQuestionnaireSchema {
  if (schema.availableLanguages.includes(newLanguage)) {
    return schema; // Language already exists
  }

  return {
    ...schema,
    availableLanguages: [...schema.availableLanguages, newLanguage],
  };
}

