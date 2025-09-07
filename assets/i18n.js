// Internationalization (i18n) System
class I18n {
    constructor() {
        this.currentLanguage = 'es';
        this.translations = {};
        this.supportedLanguages = ['es', 'en'];
        this.fallbackLanguage = 'es';
        
        this.init();
    }
    
    async init() {
        // Detect browser language
        const browserLang = this.detectBrowserLanguage();
        
        // Get saved language preference
        const savedLang = localStorage.getItem('preferred-language');
        
        // Determine which language to use
        const targetLang = savedLang || browserLang || this.fallbackLanguage;
        
        // Load translations
        await this.loadLanguage(targetLang);
        
        // Apply translations to the page
        this.applyTranslations();
        
        // Setup language selector
        this.setupLanguageSelector();
        
        console.log(`🌍 Language initialized: ${this.currentLanguage}`);
    }
    
    detectBrowserLanguage() {
        // Get browser language
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0]; // Get just the language part (es, en, etc.)
        
        // Check if we support this language
        return this.supportedLanguages.includes(langCode) ? langCode : this.fallbackLanguage;
    }
    
    async loadLanguage(langCode) {
        try {
            const response = await fetch(`/assets/i18n/${langCode}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language: ${langCode}`);
            }
            
            this.translations = await response.json();
            this.currentLanguage = langCode;
            
            // Save preference
            localStorage.setItem('preferred-language', langCode);
            
            // Update document language
            document.documentElement.lang = langCode;
            
        } catch (error) {
            console.error('Error loading language:', error);
            
            // Fallback to default language if current fails
            if (langCode !== this.fallbackLanguage) {
                await this.loadLanguage(this.fallbackLanguage);
            }
        }
    }
    
    // Get translation by key path (e.g., "home.hero.title")
    t(keyPath, fallback = '') {
        const keys = keyPath.split('.');
        let value = this.translations;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return fallback || keyPath;
            }
        }
        
        return typeof value === 'string' ? value : fallback || keyPath;
    }
    
    // Apply translations to elements with data-i18n attribute
    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (translation !== key) {
                // Check if it's a placeholder
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Update page title
        const titleKey = document.querySelector('meta[name="i18n-title"]');
        if (titleKey) {
            const title = this.t(titleKey.content);
            document.title = title;
        }
    }
    
    // Setup language selector in the header
    setupLanguageSelector() {
        // Create language selector if it doesn't exist
        let selector = document.getElementById('language-selector');
        
        if (!selector) {
            selector = this.createLanguageSelector();
        }
        
        this.updateLanguageSelector(selector);
    }
    
    createLanguageSelector() {
        const selector = document.createElement('div');
        selector.id = 'language-selector';
        selector.className = 'relative inline-block text-left';
        
        selector.innerHTML = `
            <button type="button" 
                    class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    id="language-button"
                    aria-expanded="false"
                    aria-haspopup="true">
                <span id="current-language-flag">🌍</span>
                <span id="current-language-name" class="ml-2">Language</span>
                <svg class="ml-2 -mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            
            <div id="language-dropdown" 
                 class="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div class="py-1" role="menu">
                    ${this.supportedLanguages.map(lang => `
                        <button class="language-option w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                                data-lang="${lang}"
                                role="menuitem">
                            <span class="language-flag mr-3">🌍</span>
                            <span class="language-name">Loading...</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add to header navigation
        const nav = document.querySelector('nav .flex.items-center.justify-between');
        if (nav) {
            nav.appendChild(selector);
        }
        
        // Setup event listeners
        this.setupLanguageSelectorEvents(selector);
        
        return selector;
    }
    
    setupLanguageSelectorEvents(selector) {
        const button = selector.querySelector('#language-button');
        const dropdown = selector.querySelector('#language-dropdown');
        const options = selector.querySelectorAll('.language-option');
        
        // Toggle dropdown
        button.addEventListener('click', () => {
            const isHidden = dropdown.classList.contains('hidden');
            dropdown.classList.toggle('hidden', !isHidden);
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
        
        // Handle language selection
        options.forEach(option => {
            option.addEventListener('click', async () => {
                const lang = option.getAttribute('data-lang');
                await this.changeLanguage(lang);
                dropdown.classList.add('hidden');
            });
        });
    }
    
    async updateLanguageSelector(selector) {
        // Load language metadata for all supported languages
        for (const lang of this.supportedLanguages) {
            try {
                const response = await fetch(`/assets/i18n/${lang}.json`);
                const data = await response.json();
                
                const option = selector.querySelector(`[data-lang="${lang}"]`);
                if (option) {
                    const flag = option.querySelector('.language-flag');
                    const name = option.querySelector('.language-name');
                    
                    if (flag) flag.textContent = data.meta.flag;
                    if (name) name.textContent = data.meta.name;
                }
            } catch (error) {
                console.error(`Error loading metadata for ${lang}:`, error);
            }
        }
        
        // Update current language display
        const currentFlag = selector.querySelector('#current-language-flag');
        const currentName = selector.querySelector('#current-language-name');
        
        if (currentFlag) currentFlag.textContent = this.translations.meta.flag;
        if (currentName) currentName.textContent = this.translations.meta.name;
    }
    
    async changeLanguage(langCode) {
        if (langCode === this.currentLanguage) return;
        
        console.log(`🌍 Changing language to: ${langCode}`);
        
        // Show loading state
        document.body.style.opacity = '0.7';
        
        try {
            await this.loadLanguage(langCode);
            this.applyTranslations();
            this.updateLanguageSelector(document.getElementById('language-selector'));
            
            // Reload catalog data if we're on the main page
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                if (typeof loadCatalog === 'function') {
                    await loadCatalog();
                }
            }
            
            // Reload dataset if we're on a dataset page
            if (window.location.pathname.includes('dataset')) {
                if (window.datasetViewer) {
                    // Trigger a refresh of the dataset viewer
                    window.location.reload();
                }
            }
            
        } catch (error) {
            console.error('Error changing language:', error);
        } finally {
            document.body.style.opacity = '1';
        }
    }
    
    // Format numbers according to current locale
    formatNumber(number, options = {}) {
        const locale = this.currentLanguage === 'es' ? 'es-ES' : 'en-US';
        return new Intl.NumberFormat(locale, options).format(number);
    }
    
    // Format dates according to current locale
    formatDate(date, options = {}) {
        const locale = this.currentLanguage === 'es' ? 'es-ES' : 'en-US';
        return new Intl.DateTimeFormat(locale, options).format(date);
    }
}

// Initialize i18n system
const i18n = new I18n();

// Make it globally available
window.i18n = i18n;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}
