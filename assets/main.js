// Global variables
let catalogData = null;
let currentCategory = 'all';

// Icon mapping for categories
const categoryIcons = {
    'demografia': 'users',
    'economia': 'trending-up',
    'energia': 'zap',
    'default': 'database'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Initialize AOS
    AOS.init({
        duration: 500, // Animation duration
        once: true,    // Animate only once
    });
    
    // Wait for i18n to be ready
    if (window.i18n) {
        // Wait a bit for i18n to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Load catalog data
    loadCatalog();
    
    // Setup category filter event listeners
    setupCategoryFilters();

    // Setup scrollspy for navigation
    setupScrollSpy();
});

// Setup scrollspy for navigation links
function setupScrollSpy() {
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('header nav a[href^="#"]');
    
    // Throttling function to limit how often the scroll handler runs
    let throttleTimer;
    const throttle = (callback, time) => {
        if (throttleTimer) return;
        throttleTimer = true;
        setTimeout(() => {
            callback();
            throttleTimer = false;
        }, time);
    };

    const onScroll = () => {
        const scrollPosition = window.scrollY + 150; // Offset for better accuracy

        sections.forEach(section => {
            if (scrollPosition >= section.offsetTop && scrollPosition < section.offsetTop + section.offsetHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('text-accent-600', 'dark:text-accent-400', 'font-bold');
                    if (`#${section.id}` === link.getAttribute('href')) {
                        link.classList.add('text-accent-600', 'dark:text-accent-400', 'font-bold');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', () => throttle(onScroll, 150));
}

// Load catalog data from JSON
async function loadCatalog() {
    try {
        showLoading(true);
        
        // Determine which catalog to load based on current language
        const currentLang = window.i18n ? window.i18n.currentLanguage : 'es';
        const catalogFile = currentLang === 'en' ? 'data/catalog_en.json' : 'data/catalog.json';
        
        const response = await fetch(catalogFile);
        
        if (!response.ok) {
            // Fallback to Spanish catalog if English fails
            if (catalogFile.includes('_en')) {
                const fallbackResponse = await fetch('data/catalog.json');
                if (fallbackResponse.ok) {
                    catalogData = await fallbackResponse.json();
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } else {
            catalogData = await response.json();
        }
        
        // Clear existing categories (except "Todos" button)
        const categoriesFilter = document.getElementById('categories-filter');
        const allButton = categoriesFilter.querySelector('[data-category="all"]');
        categoriesFilter.innerHTML = '';
        if (allButton) {
            categoriesFilter.appendChild(allButton);
        }
        
        // Render categories and datasets
        renderCategories();
        renderDatasets();
        
        showLoading(false);
        showError(false);
        
    } catch (error) {
        console.error('Error loading catalog:', error);
        showLoading(false);
        showError(true);
    }
}

// Make loadCatalog globally available
window.loadCatalog = loadCatalog;

// Show/hide loading state
function showLoading(show) {
    const loading = document.getElementById('loading');
    const datasets = document.getElementById('datasets');
    
    if (show) {
        loading.classList.remove('hidden');
        datasets.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
        datasets.classList.remove('hidden');
    }
}

// Show/hide error state
function showError(show) {
    const errorState = document.getElementById('error-state');
    const datasetsGrid = document.getElementById('datasets-grid');
    
    if (show) {
        errorState.classList.remove('hidden');
        datasetsGrid.classList.add('hidden');
    } else {
        errorState.classList.add('hidden');
        datasetsGrid.classList.remove('hidden');
    }
}

// Render category filters
function renderCategories() {
    if (!catalogData || !catalogData.categories) return;
    
    const categoriesFilter = document.getElementById('categories-filter');
    
    // Add category buttons after "Todos"
    catalogData.categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-filter px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 transform hover:scale-105 focus:scale-105 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:shadow-sm';
        button.setAttribute('data-category', category.id);
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', 'false');
        
        // Use translation if available, fallback to category.name
        const categoryName = window.i18n ? window.i18n.t(`categories.${category.id}`, category.name) : category.name;
        
        button.innerHTML = `
            <i data-lucide="${category.icon}" class="w-4 h-4 inline mr-1" aria-hidden="true"></i>
            ${categoryName}
        `;
        categoriesFilter.appendChild(button);
    });
    
    // Re-initialize Lucide icons for new buttons
    lucide.createIcons();
}

// Setup category filter event listeners
function setupCategoryFilters() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('category-filter') || e.target.closest('.category-filter')) {
            const button = e.target.classList.contains('category-filter') ? e.target : e.target.closest('.category-filter');
            const category = button.getAttribute('data-category');
            
            // Update active state
            document.querySelectorAll('.category-filter').forEach(btn => {
                btn.classList.remove('active', 'bg-primary-600', 'text-white', 'shadow-md', 'scale-105');
                btn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-300', 'dark:hover:bg-gray-600', 'hover:shadow-sm');
                btn.setAttribute('aria-selected', 'false');
            });
            
            button.classList.add('active', 'bg-primary-600', 'text-white', 'shadow-md', 'scale-105');
            button.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-300', 'dark:hover:bg-gray-600', 'hover:shadow-sm');
            button.setAttribute('aria-selected', 'true');
            
            currentCategory = category;
            renderDatasets();
        }
    });
}

// Render datasets grid
function renderDatasets() {
    if (!catalogData || !catalogData.datasets) return;
    
    const grid = document.getElementById('datasets-grid');
    
    // Filter datasets by category
    const filteredDatasets = currentCategory === 'all' 
        ? catalogData.datasets 
        : catalogData.datasets.filter(dataset => dataset.category === currentCategory);
    
    // Clear grid
    grid.innerHTML = '';
    
    // Render dataset cards
    filteredDatasets.forEach(dataset => {
        const card = createDatasetCard(dataset);
        grid.appendChild(card);
    });
    
    // Re-initialize Lucide icons
    lucide.createIcons();
}

// Create dataset card element
function createDatasetCard(dataset) {
    const article = document.createElement('article');
    article.className = 'bg-white dark:bg-neutral-800 rounded-lg shadow-sm hover:shadow-lg focus-within:shadow-lg transition-all duration-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 overflow-hidden transform hover:scale-[1.02] focus-within:scale-[1.02] flex flex-col';
    article.setAttribute('aria-labelledby', `dataset-title-${dataset.id}`);
    article.setAttribute('aria-describedby', `dataset-desc-${dataset.id}`);
    article.setAttribute('data-aos', 'fade-up');
    
    const categoryInfo = catalogData.categories.find(cat => cat.id === dataset.category);
    const categoryIcon = categoryInfo ? categoryInfo.icon : categoryIcons.default;
    
    // Use local images based on category instead of external placeholders
    const getDatasetImage = (dataset) => {
        // If dataset has a valid local image, use it
        if (dataset.image && !dataset.image.includes('via.placeholder.com')) {
            return dataset.image;
        }
        
        // Map categories to local images
        const categoryImages = {
            'demografia': '/assets/images/datasets/demografia.svg',
            'economia': '/assets/images/datasets/economia.svg',
            'energia': '/assets/images/datasets/energia.svg',
            'tecnologia': '/assets/images/datasets/tecnologia.svg',
            'inteligencia_artificial': '/assets/images/datasets/inteligencia_artificial.svg',
            'clima_extremo': '/assets/images/datasets/clima_extremo.svg',
            'economia_digital': '/assets/images/datasets/economia_digital.svg',
            'salud_futuro': '/assets/images/datasets/salud_futuro.svg',
            'cultura_digital': '/assets/images/datasets/cultura_digital.svg'
        };
        
        return categoryImages[dataset.category] || '/assets/images/datasets/default.svg';
    };
    
    const imageUrl = getDatasetImage(dataset);

    // Get translations
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key, fallback) => fallback || key;
    
    article.innerHTML = `
        <div class="relative">
            <img src="${imageUrl}" 
                 alt="Visualización de datos para ${dataset.title}" 
                 class="w-full h-40 object-cover"
                 loading="lazy"
                 onerror="this.src='/assets/images/datasets/default.svg'; this.onerror=null;">
            <div class="absolute top-2 right-2 flex flex-col gap-2">
                ${dataset.featured ? `<span class="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium px-2 py-1 rounded-full" role="status" aria-label="Dataset popular">${t('home.datasets.featured', 'Popular')}</span>` : ''}
                ${dataset.has_filters ? `<span class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1" role="status" aria-label="Dataset con filtros interactivos"><i data-lucide="filter" class="w-3 h-3" aria-hidden="true"></i>${t('home.datasets.filters', 'Filtros')}</span>` : ''}
            </div>
        </div>
        <div class="p-6 flex flex-col flex-grow">
            <div class="flex items-start justify-between mb-4">
                <div class="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg transition-colors duration-200 group-hover:bg-primary-200 dark:group-hover:bg-primary-800/40" aria-label="Categoría: ${categoryInfo ? categoryInfo.name : 'General'}">
                    <i data-lucide="${categoryIcon}" class="w-6 h-6 text-primary-700 dark:text-primary-300" aria-hidden="true"></i>
                </div>
            </div>
            
            <h4 id="dataset-title-${dataset.id}" class="text-xl font-semibold font-serif mb-2 text-primary-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors duration-200">
                ${dataset.title}
            </h4>
            
            <p id="dataset-desc-${dataset.id}" class="text-neutral-600 dark:text-neutral-300 mb-4 line-clamp-3 leading-relaxed flex-grow">
                ${dataset.description}
            </p>
            
            <div class="space-y-3 mb-6" role="list" aria-label="Metadatos del dataset">
                <div class="flex items-center text-sm text-neutral-500 dark:text-neutral-400" role="listitem">
                    <i data-lucide="calendar" class="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true"></i>
                    <span><span class="sr-only">${t('home.datasets.period', 'Período:')} </span>${dataset.temporal_coverage} • ${dataset.records} ${t('home.datasets.records', 'puntos')}</span>
                </div>
                
                <div class="flex items-center text-sm text-neutral-500 dark:text-neutral-400" role="listitem">
                    <i data-lucide="globe" class="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true"></i>
                    <span><span class="sr-only">Cobertura: </span>${dataset.spatial_coverage}</span>
                </div>
            </div>
            
            <div class="flex items-center justify-between mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div class="flex space-x-1" role="group" aria-label="Tipos de gráficos disponibles">
                    ${dataset.chart_types.slice(0, 3).map(type => {
                        const iconMap = {
                            'line': 'trending-up',
                            'bar': 'bar-chart',
                            'map': 'map',
                            'scatter': 'scatter-chart'
                        };
                        return `<i data-lucide="${iconMap[type] || 'bar-chart'}" class="w-4 h-4 text-neutral-400 hover:text-accent-500 transition-colors duration-200" aria-label="Gráfico de ${type}" role="img"></i>`;
                    }).join('')}
                </div>
                
                <button onclick="navigateToDataset('${dataset.id}')" 
                   class="inline-flex items-center space-x-2 bg-accent-500 hover:bg-accent-600 focus:bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800 transform hover:scale-105 focus:scale-105 shadow-sm hover:shadow-md"
                   aria-describedby="dataset-title-${dataset.id}">
                    <span>${t('home.datasets.view_data', 'Ver datos')}</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add group class for hover effects
    article.classList.add('group');
    
    return article;
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Function to navigate to dataset page with proper ID handling
function navigateToDataset(datasetId) {
    // Save the dataset ID in sessionStorage
    sessionStorage.setItem('selectedDatasetId', datasetId);
    
    // Also save in localStorage as backup
    localStorage.setItem('lastViewedDataset', datasetId);
    
    // Navigate to dataset page
    window.location.href = 'dataset.html?id=' + datasetId;
}
