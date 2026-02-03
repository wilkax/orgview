# Internationalization (i18n) Implementation Guide

## 🎯 Quick Start - How to Use i18n Features

### For End Users

#### 1. **Changing Website Language (Authenticated Users)**
- Log in to your account
- Click on your profile icon in the top-right corner
- In the dropdown menu, you'll see a "Language" section
- Select your preferred language (English or German)
- The page will reload with the new language

#### 2. **Changing Questionnaire Language (Participants)**
- When you open a questionnaire link (e.g., `/q/[token]`)
- If the questionnaire supports multiple languages, you'll see a language selector in the top-right corner of the questionnaire header
- Click the language dropdown and select your preferred language
- The questionnaire will immediately switch to that language
- Your language preference is saved in your browser for future visits

### For Administrators

#### 1. **Creating Multilingual Questionnaires**
Currently, questionnaires are created in a single language (default: English). To add support for multiple languages:

1. Create a questionnaire in the primary language
2. The `language` field will be set to 'en' by default
3. The `available_languages` field will be set to `['en']` by default

**To add translations** (requires manual database update for now):
```sql
-- Update the questionnaire to support multiple languages
UPDATE questionnaires
SET available_languages = ARRAY['en', 'de']
WHERE id = 'your-questionnaire-id';

-- Add a German translation
INSERT INTO questionnaire_translations (questionnaire_id, language, title, description, schema)
VALUES (
  'your-questionnaire-id',
  'de',
  'German Title',
  'German Description',
  '{"sections": [...]}'  -- Translated schema
);
```

**Future Enhancement**: A UI for managing questionnaire translations will be added to the admin panel.

---

## Overview

This document describes the multi-language support implementation for the OrgView application, with a focus on questionnaire translations.

## Architecture

### 1. Next.js Application i18n

The Next.js application uses `next-intl` for internationalization:

- **Supported Languages**: English (en), German (de)
- **Configuration**: `src/i18n/config.ts`, `src/i18n/request.ts` and `src/i18n/routing.ts`
- **Translation Files**: `messages/en.json` and `messages/de.json`
- **Middleware**:
  - `src/lib/supabase/proxy.ts` - Supabase session management helper
  - `src/middleware.ts` - Main middleware file that handles both Supabase session management and i18n locale detection/persistence

### 2. Questionnaire Multi-Language Support

Questionnaires support multiple languages through a flexible schema structure:

#### Database Schema

- **questionnaires table**:
  - `language`: Primary language of the questionnaire (default: 'en')
  - `available_languages`: Array of available language codes
  
- **questionnaire_translations table**: Stores translations for questionnaires
  - `questionnaire_id`: Reference to the questionnaire
  - `language`: Language code
  - `title`: Translated title
  - `description`: Translated description
  - `schema`: Translated questionnaire schema

#### Multilingual Questionnaire Schema

The questionnaire schema supports translations at multiple levels:

```typescript
interface MultilingualQuestionnaireSchema {
  sections: MultilingualSection[];
  primaryLanguage: SupportedLanguage;
  availableLanguages: SupportedLanguage[];
}

interface MultilingualSection {
  id: string;
  title: TranslatableText; // { en: "...", de: "..." }
  description?: TranslatableText;
  questions: MultilingualQuestion[];
}

interface MultilingualQuestion {
  id: string;
  text: TranslatableText; // Question text in different languages
  type: 'scale' | 'single-choice' | 'multiple-choice' | 'ranking' | 'free-text';
  required?: boolean;
  scale?: TranslatableScale; // Scale labels in different languages
  options?: TranslatableOptions; // Options in different languages
  maxLength?: number;
}
```

## Components

### 1. LanguageSwitcher

Global language switcher for the Next.js application (for authenticated users).

**Location**: `src/components/LanguageSwitcher.tsx`

**Usage**:
```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

<LanguageSwitcher currentLocale={locale} />
```

### 2. QuestionnaireLanguageSelector

Language selector specifically for questionnaire responses (for participants in /q pages).

**Location**: `src/components/QuestionnaireLanguageSelector.tsx`

**Features**:
- Shows only if questionnaire has multiple languages
- Persists selection in localStorage
- Emits custom event when language changes

**Usage**:
```tsx
<QuestionnaireLanguageSelector availableLanguages={['en', 'de']} />
```

### 3. QuestionnaireResponseForm

Updated to support multilingual questionnaires.

**Features**:
- Automatically detects if questionnaire schema is multilingual
- Listens for language change events
- Renders questions in selected language with fallback to primary language

## Workflow

### Creating a Multilingual Questionnaire

1. **Create questionnaire in primary language** (e.g., English)
2. **Add translations** using DeepL or manual translation
3. **Store translations** in the `questionnaire_translations` table
4. **Update available_languages** array in questionnaire config

### Answering a Questionnaire

1. Participant opens questionnaire via `/q/[token]`
2. If multiple languages available, language selector appears
3. Participant selects preferred language
4. Questions display in selected language
5. Answers are stored with question IDs (language-independent)

## Helper Functions

Located in `src/lib/questionnaire/i18n-schema.ts`:

- `getTranslatedText()`: Get text in specific language with fallback
- `getTranslatedOptions()`: Get options in specific language with fallback
- `getTranslatedScale()`: Get scale labels in specific language with fallback
- `getLocalizedSchema()`: Convert multilingual schema to single-language schema
- `createEmptyMultilingualSchema()`: Create new multilingual schema
- `addLanguageToSchema()`: Add new language to existing schema

## Migration

Run the migration to add i18n support:

```bash
supabase migration up
```

Migration file: `supabase/migrations/20260203000000_add_i18n_support.sql`

## Future Enhancements

1. **DeepL Integration**: Automatic translation of questionnaires
2. **More Languages**: Add support for additional languages
3. **Admin UI**: Interface for managing questionnaire translations
4. **Translation Status**: Track which questionnaires have complete translations
5. **Language Detection**: Auto-detect participant's preferred language

## Testing

1. Create a questionnaire with multilingual schema
2. Access via `/q/[token]`
3. Switch between languages
4. Verify all text updates correctly
5. Submit response and verify answers are saved correctly

## Notes

- Answers are stored with question IDs, making them language-independent
- The same response can be viewed in any available language
- Primary language is used as fallback if translation is missing
- Language preference for questionnaires is stored in localStorage (per-browser)

