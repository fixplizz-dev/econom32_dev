'use client';

import React, { useState, useEffect } from 'react';


interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extra-large';
  contrast: 'normal' | 'high' | 'inverted';
  isEnabled: boolean;
}

export const AccessibilityPanel: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'normal',
    contrast: 'normal',
    isEnabled: false
  });
  const [isOpen, setIsOpen] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applySettings(parsed);
    }
  }, []);

  // Apply settings to document
  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Remove existing classes
    root.classList.remove('accessibility-enabled', 'font-large', 'font-extra-large', 'contrast-high', 'contrast-inverted');
    
    if (newSettings.isEnabled) {
      root.classList.add('accessibility-enabled');
      
      // Font size
      if (newSettings.fontSize === 'large') {
        root.classList.add('font-large');
      } else if (newSettings.fontSize === 'extra-large') {
        root.classList.add('font-extra-large');
      }
      
      // Contrast
      if (newSettings.contrast === 'high') {
        root.classList.add('contrast-high');
      } else if (newSettings.contrast === 'inverted') {
        root.classList.add('contrast-inverted');
      }
    }
  };

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    applySettings(updated);
    localStorage.setItem('accessibility-settings', JSON.stringify(updated));
  };

  const toggleAccessibility = () => {
    updateSettings({ isEnabled: !settings.isEnabled });
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      fontSize: 'normal',
      contrast: 'normal',
      isEnabled: false
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');
  };

  return (
    <>
      {/* Accessibility Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 accessibility-button text-white px-3 py-2 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-xs lg:text-sm font-medium flex items-center"
        aria-label="Открыть панель специальных возможностей"
        title="Версия для слабовидящих"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Для слабовидящих
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="fixed top-16 left-4 z-40 bg-white border border-gray-300 rounded-lg shadow-xl p-4 lg:p-6 accessibility-panel">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Версия для слабовидящих
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Закрыть панель"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="accessibility-toggle" className="text-sm font-medium text-gray-700">
                Включить специальную версию
              </label>
              <button
                id="accessibility-toggle"
                onClick={toggleAccessibility}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={settings.isEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.isEnabled && (
              <>
                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Размер шрифта
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'normal', label: 'Обычный (100%)' },
                      { value: 'large', label: 'Крупный (150%)' },
                      { value: 'extra-large', label: 'Очень крупный (200%)' }
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center">
                        <input
                          type="radio"
                          name="fontSize"
                          value={value}
                          checked={settings.fontSize === value}
                          onChange={(e) => updateSettings({ fontSize: e.target.value as 'normal' | 'large' | 'extra-large' })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Contrast */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Контрастность
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'normal', label: 'Обычная' },
                      { value: 'high', label: 'Высокая' },
                      { value: 'inverted', label: 'Инвертированная' }
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center">
                        <input
                          type="radio"
                          name="contrast"
                          value={value}
                          checked={settings.contrast === value}
                          onChange={(e) => updateSettings({ contrast: e.target.value as 'normal' | 'high' | 'inverted' })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Reset Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={resetSettings}
                className="w-full px-3 py-2 text-sm bg-transparent text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Сбросить настройки
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};