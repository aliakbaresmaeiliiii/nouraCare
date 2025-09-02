# Multi-Language Support (i18n)

This Angular/Ionic application now supports multiple languages:
- **English** (en) - Default
- **Chinese** (zh) - 中文
- **Malaysian** (ms) - Bahasa Malaysia

## Features

### 1. Language Switcher Component
- Located in the header toolbar
- Allows users to switch between languages dynamically
- Saves language preference in localStorage
- Updates the entire application interface instantly

### 2. Translation System
- Uses Angular i18n with custom translation service
- Supports both static XLF files and dynamic translations
- Translation pipe for easy use in templates: `{{ 'key' | translate }}`

### 3. Build Configurations
The application can be built for specific languages:

```bash
# Build for English (default)
npm run build:en

# Build for Chinese
npm run build:zh

# Build for Malaysian
npm run build:ms

# Serve in development with specific language
npm run serve:en
npm run serve:zh
npm run serve:ms
```

## File Structure

```
src/
├── locale/
│   ├── messages.en.xlf    # English translations
│   ├── messages.zh.xlf    # Chinese translations
│   └── messages.ms.xlf    # Malaysian translations
├── app/
│   └── shared/
│       ├── components/
│       │   └── language-switcher/
│       │       └── language-switcher.component.ts
│       ├── services/
│       │   ├── language.service.ts
│       │   └── translation.service.ts
│       └── pipes/
│           └── translate.pipe.ts
```

## Usage

### In Templates
```html
<!-- Simple translation -->
<h1>{{ 'welcome.title' | translate }}</h1>

<!-- With dynamic content -->
<input [placeholder]="'welcome.enterEmail' | translate">
```

### In Components
```typescript
import { TranslationService } from '../shared/services/translation.service';

constructor(private translationService: TranslationService) {}

getText() {
  return this.translationService.translate('welcome.title');
}
```

### Language Service
```typescript
import { LanguageService } from '../shared/services/language.service';

constructor(private languageService: LanguageService) {}

// Get current language
const currentLang = this.languageService.getCurrentLanguage();

// Set language
this.languageService.setLanguage('zh');

// Get available languages
const languages = this.languageService.getLanguages();
```

## Adding New Translations

### 1. Add to Translation Files
Add new translation keys to all three XLF files:

**messages.en.xlf:**
```xml
<trans-unit id="new.key" datatype="html">
  <source>New Text</source>
  <target>New Text</target>
</trans-unit>
```

**messages.zh.xlf:**
```xml
<trans-unit id="new.key" datatype="html">
  <source>New Text</source>
  <target>新文本</target>
</trans-unit>
```

**messages.ms.xlf:**
```xml
<trans-unit id="new.key" datatype="html">
  <source>New Text</source>
  <target>Teks Baru</target>
</trans-unit>
```

### 2. Add to Translation Service
Update the `translation.service.ts` file with the new keys in all language objects.

### 3. Use in Templates
```html
{{ 'new.key' | translate }}
```

## Language Codes

- **en**: English (United States)
- **zh**: Chinese (Simplified)
- **ms**: Malaysian (Bahasa Malaysia)

## Browser Language Detection

The application automatically detects the user's browser language and sets it as the default if supported, otherwise falls back to English.

## Storage

Language preferences are stored in `localStorage` with the key `selectedLanguage` and persist across browser sessions.

## Development

To add a new language:

1. Create a new XLF file: `messages.{lang-code}.xlf`
2. Add build configuration in `angular.json`
3. Add language object in `translation.service.ts`
4. Add language entry in `language.service.ts`
5. Add build scripts in `package.json`

## Notes

- The language switcher is currently placed in the header toolbar
- All translations are loaded dynamically for better performance
- The system supports both static (XLF) and dynamic translations
- Language changes are applied immediately without page refresh
