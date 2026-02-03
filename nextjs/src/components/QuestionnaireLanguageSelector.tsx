'use client';

import { Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  availableLanguages: string[];
}

const languageNames: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
};

export default function QuestionnaireLanguageSelector({ availableLanguages }: Props) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get language from localStorage or use default
    const savedLanguage = localStorage.getItem('questionnaire_language');
    if (savedLanguage && availableLanguages.includes(savedLanguage)) {
      setSelectedLanguage(savedLanguage);
    } else if (availableLanguages.length > 0) {
      setSelectedLanguage(availableLanguages[0]);
    }
  }, [availableLanguages]);

  const changeLanguage = (language: string) => {
    setSelectedLanguage(language);
    localStorage.setItem('questionnaire_language', language);
    // Dispatch custom event to notify QuestionnaireResponseForm
    window.dispatchEvent(new CustomEvent('questionnaireLanguageChange', { detail: language }));
    setIsOpen(false);
  };

  if (availableLanguages.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors border border-gray-300"
        type="button"
      >
        <Globe size={16} />
        <span>{languageNames[selectedLanguage] || selectedLanguage}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <div className="py-1">
              {availableLanguages.map((language) => (
                <button
                  key={language}
                  onClick={() => changeLanguage(language)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    language === selectedLanguage ? 'bg-gray-50 font-medium' : ''
                  }`}
                  type="button"
                >
                  {languageNames[language] || language}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

