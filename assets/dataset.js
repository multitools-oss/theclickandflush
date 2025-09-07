// Dataset visualization functionality with filtering support
class DatasetViewer {
    constructor() {
        this.chart = null;
        this.datasetData = null;
        this.catalogData = null;
        this.currentDatasetInfo = null;
        this.isPlaying = false;
        this.animationId = null;
        this.currentIndex = 0;
        this.currentFilter = 'global'; // 'global' or specific continent/region
        this.availableFilters = [];
        this.filterField = null; // Field used for filtering (segment, region, continent, etc.)
        
        // DOM elements
        this.elements = {
            title: document.getElementById('title'),
            chart: document.getElementById('chart'),
            yearSlider: document.getElementById('year'),
            yearLabel: document.getElementById('yearLabel'),
            playButton: document.getElementById('play'),
            loading: document.getElementById('loading'),
            errorState: document.getElementById('error-state'),
            errorMessage: document.getElementById('error-message'),
            chartContainer: document.getElementById('chart-container'),
            metadata: document.getElementById('metadata'),
            description: document.getElementById('description'),
            temporalCoverage: document.getElementById('temporal-coverage'),
            spatialCoverage: document.getElementById('spatial-coverage'),
            source: document.getElementById('source'),
            updated: document.getElementById('updated'),
            downloadLink: document.getElementById('download-link'),
            datasetInfo: document.getElementById('dataset-info'),
            fieldsList: document.getElementById('fields-list'),
            sourceInfo: document.getElementById('source-info'),
            lastUpdated: document.getElementById('last-updated'),
            filterControls: document.getElementById('filter-controls')
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Debug: Log current URL and parameters
            console.log('Current URL:', window.location.href);
            console.log('URL search params:', window.location.search);
            console.log('URL hash:', window.location.hash);
            console.log('SessionStorage selectedDatasetId:', sessionStorage.getItem('selectedDatasetId'));
            console.log('LocalStorage lastViewedDataset:', localStorage.getItem('lastViewedDataset'));
            
            // Get dataset ID from URL
            const datasetId = this.getDatasetIdFromUrl();
            console.log('Resolved dataset ID:', datasetId);
            
            if (!datasetId) {
                // Si no hay un ID de dataset, redirigir a la página de inicio
                window.location.href = '/';
                return;
            }
            
            // Load catalog and find dataset info
            await this.loadCatalog();
            this.currentDatasetInfo = this.findDatasetInCatalog(datasetId);
            
            if (!this.currentDatasetInfo) {
                // Redirigir a 404 si el ID no existe
                window.location.href = '/404.html';
                return;
            }
            
            // Load dataset data
            await this.loadDatasetData();
            
            // Setup filters if available
            this.setupFilters();
            
            // Initialize chart and controls
            this.initializeChart();
            this.setupControls();
            this.updateMetadata();
            
            // Show content
            this.showContent();
            
        } catch (error) {
            console.error('Error initializing dataset viewer:', error);
            this.showError(error.message);
        }
    }
    
    getDatasetIdFromUrl() {
        // Try to get ID from URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        let datasetId = urlParams.get('id');
        
        // If no ID in URL params, try to get from hash
        if (!datasetId && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            datasetId = hashParams.get('id');
        }
        
        // If still no ID, try to get from sessionStorage (for redirects)
        if (!datasetId && sessionStorage.getItem('selectedDatasetId')) {
            datasetId = sessionStorage.getItem('selectedDatasetId');
            // Clear it after use
            sessionStorage.removeItem('selectedDatasetId');
        }
        
        // If still no ID, try to get from localStorage as fallback
        if (!datasetId && localStorage.getItem('lastViewedDataset')) {
            datasetId = localStorage.getItem('lastViewedDataset');
        }
        
        return datasetId;
    }
    
    async loadCatalog() {
        try {
            const response = await fetch('../data/catalog.json');
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}: No se pudo cargar el catálogo`);
            }
            this.catalogData = await response.json();
        } catch (error) {
            throw new Error(`Error cargando catálogo: ${error.message}`);
        }
    }
    
    findDatasetInCatalog(datasetId) {
        if (!this.catalogData || !this.catalogData.datasets) {
            return null;
        }
        return this.catalogData.datasets.find(dataset => dataset.id === datasetId);
    }
    
    async loadDatasetData() {
        try {
            // Construct a safe relative path
            const path = `../${this.currentDatasetInfo.file_path.replace(/^\//, '')}`;
            
            const response = await fetch(path);
            if (!response.ok) {
                if (response.status === 404) {
                    // If dataset file is not found, redirect to a 404 page
                    window.location.href = '/404.html';
                }
                throw new Error(`Error HTTP ${response.status}: No se pudo cargar el dataset desde ${path}`);
            }
            this.datasetData = await response.json();
            
            // Validate data structure
            if (!this.datasetData.fields) {
                throw new Error('Estructura de datos inválida: falta campo "fields"');
            }
            
            // Check if we have summary data (global) or breakdown data
            if (!this.datasetData.summary && !this.datasetData.breakdown && !this.datasetData.data) {
                throw new Error('No hay datos disponibles en el dataset');
            }
            
        } catch (error) {
            throw new Error(`Error cargando datos del dataset: ${error.message}`);
        }
    }
    
    setupFilters() {
        // Check if dataset has breakdown data for filtering
        if (this.datasetData.breakdown && this.datasetData.metadata.breakdown_key) {
            // New structure with summary + breakdown
            const breakdownKey = this.datasetData.metadata.breakdown_key;
            
            // Get unique filter values
            this.availableFilters = ['global', ...new Set(
                this.datasetData.breakdown.map(item => item[breakdownKey])
            )].sort();
            
            // Create filter UI
            this.createFilterUI();
        } else if (this.datasetData.data && this.datasetData.data.length > 0) {
            // Check if data has filterable fields (like segment, region, continent)
            const firstItem = this.datasetData.data[0];
            const filterableFields = ['segment', 'region', 'continent', 'country'];
            
            for (const field of filterableFields) {
                if (firstItem[field]) {
                    // Found a filterable field
                    this.filterField = field;
                    this.availableFilters = ['global', ...new Set(
                        this.datasetData.data.map(item => item[field])
                    )].sort();
                    
                    // Create filter UI
                    this.createFilterUI();
                    break;
                }
            }
        }
    }
    
    createFilterUI() {
        const filterContainer = document.getElementById('filter-controls');
        if (!filterContainer) return;
        
        const filterLabel = this.filterField === 'segment' ? 'segmento' : 
                           this.filterField === 'region' ? 'región' :
                           this.filterField === 'continent' ? 'continente' : 'filtro';
        
        filterContainer.innerHTML = `
            <div class="mb-4">
                <label for="region-filter" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Filtrar por ${filterLabel}:
                </label>
                <select id="region-filter" 
                        class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    ${this.availableFilters.map(filter => 
                        `<option value="${filter}" ${filter === 'global' ? 'selected' : ''}>
                            ${filter === 'global' ? 'Global (Todos)' : filter}
                        </option>`
                    ).join('')}
                </select>
            </div>
        `;
        
        // Add event listener
        const filterSelect = document.getElementById('region-filter');
        filterSelect.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.updateChart();
            this.updateYearRange();
        });
        
        // Show filter controls
        filterContainer.classList.remove('hidden');
    }
    
    prepareChartData() {
        let dataSource;
        
        if (this.currentFilter === 'global') {
            // Use summary data if available, otherwise aggregate all data
            if (this.datasetData.summary) {
                dataSource = this.datasetData.summary;
            } else if (this.datasetData.data) {
                // Aggregate data by year
                const aggregated = {};
                this.datasetData.data.forEach(item => {
                    if (!aggregated[item.year]) {
                        aggregated[item.year] = 0;
                    }
                    aggregated[item.year] += item.value || 0;
                });
                
                dataSource = Object.keys(aggregated).map(year => ({
                    year: parseInt(year),
                    value: aggregated[year]
                })).sort((a, b) => a.year - b.year);
            } else {
                dataSource = [];
            }
        } else {
            // Filter data by selected region/segment
            if (this.datasetData.breakdown && this.datasetData.metadata.breakdown_key) {
                // New structure with breakdown
                const breakdownKey = this.datasetData.metadata.breakdown_key;
                dataSource = this.datasetData.breakdown.filter(item => 
                    item[breakdownKey] === this.currentFilter
                );
            } else if (this.datasetData.data && this.filterField) {
                // Simple structure with filterable field
                dataSource = this.datasetData.data.filter(item => 
                    item[this.filterField] === this.currentFilter
                );
            } else {
                dataSource = [];
            }
        }
        
        const years = [];
        const values = [];
        
        // Extract years and values from data
        dataSource.forEach(item => {
            if (item.year && item.value !== undefined) {
                years.push(item.year);
                values.push(item.value);
            }
        });
        
        return { years, values };
    }
    
    updateChart() {
        if (!this.chart) return;
        
        const chartData = this.prepareChartData();
        const unit = this.datasetData.metadata.unit || '';
        const isTemperature = unit.includes('°C');
        
        // Update chart data
        const option = {
            xAxis: {
                data: chartData.years
            },
            series: [{
                data: chartData.values,
                lineStyle: {
                    color: isTemperature ? '#ef4444' : '#0ea5e9'
                },
                areaStyle: {
                    color: isTemperature ? '#ef4444' : '#0ea5e9'
                }
            }]
        };
        
        this.chart.setOption(option);
        
        // Update current index if needed
        if (this.currentIndex >= chartData.years.length) {
            this.currentIndex = chartData.years.length - 1;
        }
        
        this.highlightDataPoint(this.currentIndex);
    }
    
    updateYearRange() {
        const chartData = this.prepareChartData();
        this.setupYearRange(chartData.years);
    }
    
    initializeChart() {
        // Initialize ECharts instance
        this.chart = echarts.init(this.elements.chart, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        
        // Prepare data for chart
        const chartData = this.prepareChartData();
        
        // Determine chart configuration based on data type
        const unit = this.datasetData.metadata.unit || '';
        const isPercentage = unit.includes('%');
        const isTemperature = unit.includes('°C');
        const isCurrency = unit.includes('USD');
        
        // Configure chart options
        const option = {
            title: {
                text: this.currentDatasetInfo.title,
                left: 'center',
                top: '2%',
                textStyle: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#404040'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                },
                formatter: (params) => {
                    if (params && params.length > 0) {
                        const param = params[0];
                        let value = param.value;
                        
                        // Format value based on data type
                        if (isPercentage) {
                            value = `${value.toFixed(1)}%`;
                        } else if (isTemperature) {
                            value = `${value > 0 ? '+' : ''}${value.toFixed(2)}°C`;
                        } else if (isCurrency) {
                            value = `$${value.toLocaleString()}`;
                        } else if (value >= 1000000000) {
                            value = `${(value / 1000000000).toFixed(1)}B`;
                        } else if (value >= 1000000) {
                            value = `${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                            value = `${(value / 1000).toFixed(1)}K`;
                        } else {
                            value = value.toLocaleString();
                        }
                        
                        const regionText = this.currentFilter !== 'global' ? ` (${this.currentFilter})` : '';
                        return `<strong>${param.name}${regionText}</strong><br/>${param.seriesName}: ${value}`;
                    }
                    return '';
                }
            },
            grid: {
                left: '10%',
                right: '5%',
                top: '20%',
                bottom: '15%',
                width: '85%',
                height: '65%'
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: chartData.years,
                axisLabel: {
                    formatter: (value) => value,
                    rotate: chartData.years.length > 50 ? 45 : 0,
                    interval: chartData.years.length > 50 ? Math.floor(chartData.years.length / 8) : 'auto'
                },
                axisTick: {
                    alignWithLabel: true
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: (value) => {
                        if (isPercentage) {
                            return `${value}%`;
                        } else if (isTemperature) {
                            return `${value > 0 ? '+' : ''}${value}°C`;
                        } else if (isCurrency) {
                            return `$${value.toLocaleString()}`;
                        } else if (value >= 1000000000) {
                            return `${(value / 1000000000).toFixed(1)}B`;
                        } else if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                            return `${(value / 1000).toFixed(1)}K`;
                        }
                        return value.toLocaleString();
                    }
                }
            },
            series: [{
                name: this.getValueFieldName(),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 4,
                lineStyle: {
                    width: 3,
                    color: isTemperature ? '#ef4444' : '#0ea5e9'
                },
                areaStyle: {
                    opacity: 0.1,
                    color: isTemperature ? '#ef4444' : '#0ea5e9'
                },
                data: chartData.values,
                animation: true,
                animationDuration: 300
            }]
        };
        
        // Set chart option
        this.chart.setOption(option);
        
        // Force resize to ensure chart uses full container space
        setTimeout(() => {
            if (this.chart) {
                this.chart.resize();
            }
        }, 100);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.chart) {
                this.chart.resize();
            }
        });
        
        // Setup year range for slider
        this.setupYearRange(chartData.years);
    }
    
    getValueFieldName() {
        // Try to find the main value field name
        const valueFields = this.datasetData.fields.filter(field => 
            field.name !== 'year' && 
            field.name !== 'country_code' && 
            field.name !== 'country_name' && 
            field.name !== 'region' &&
            field.name !== 'continent'
        );
        
        if (valueFields.length > 0) {
            return valueFields[0].description || valueFields[0].name;
        }
        
        return 'Valor';
    }
    
    setupYearRange(years) {
        if (years.length === 0) return;
        
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        
        // Update slider attributes dynamically
        this.elements.yearSlider.min = 0;
        this.elements.yearSlider.max = years.length - 1;
        this.elements.yearSlider.value = years.length - 1; // Start with latest year
        
        // Update slider labels in HTML
        this.elements.yearSlider.setAttribute('aria-label', `Seleccionar año entre ${minYear} y ${maxYear}`);
        
        this.currentIndex = years.length - 1;
        this.updateYearLabel(years[this.currentIndex]);
        
        // Update year range display if exists
        const yearRangeDisplay = document.getElementById('year-range-display');
        if (yearRangeDisplay) {
            yearRangeDisplay.textContent = `${minYear} - ${maxYear}`;
        }
    }
    
    setupControls() {
        // Year slider event
        this.elements.yearSlider.addEventListener('input', (e) => {
            this.currentIndex = parseInt(e.target.value);
            const chartData = this.prepareChartData();
            this.updateYearLabel(chartData.years[this.currentIndex]);
            this.highlightDataPoint(this.currentIndex);
        });
        
        // Play button event
        this.elements.playButton.addEventListener('click', () => {
            this.toggleAnimation();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Only handle if focus is not on an input element
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
            
            const chartData = this.prepareChartData();
            const maxIndex = chartData.years.length - 1;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (this.currentIndex > 0) {
                        this.currentIndex--;
                        this.elements.yearSlider.value = this.currentIndex;
                        this.updateYearLabel(chartData.years[this.currentIndex]);
                        this.highlightDataPoint(this.currentIndex);
                    }
                    break;
                    
                case 'ArrowRight':
                    e.preventDefault();
                    if (this.currentIndex < maxIndex) {
                        this.currentIndex++;
                        this.elements.yearSlider.value = this.currentIndex;
                        this.updateYearLabel(chartData.years[this.currentIndex]);
                        this.highlightDataPoint(this.currentIndex);
                    }
                    break;
                    
                case ' ':
                case 'Enter':
                    if (document.activeElement === this.elements.playButton) {
                        e.preventDefault();
                        this.toggleAnimation();
                    }
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    this.currentIndex = 0;
                    this.elements.yearSlider.value = this.currentIndex;
                    this.updateYearLabel(chartData.years[this.currentIndex]);
                    this.highlightDataPoint(this.currentIndex);
                    break;
                    
                case 'End':
                    e.preventDefault();
                    this.currentIndex = maxIndex;
                    this.elements.yearSlider.value = this.currentIndex;
                    this.updateYearLabel(chartData.years[this.currentIndex]);
                    this.highlightDataPoint(this.currentIndex);
                    break;
            }
        });
        
        // Announce year changes to screen readers
        this.elements.yearSlider.addEventListener('change', () => {
            const chartData = this.prepareChartData();
            const year = chartData.years[this.currentIndex];
            const value = chartData.values[this.currentIndex];
            const unit = this.datasetData.metadata.unit || '';
            
            // Format value for announcement
            let formattedValue;
            if (unit.includes('%')) {
                formattedValue = `${value.toFixed(1)} por ciento`;
            } else if (unit.includes('°C')) {
                formattedValue = `${value > 0 ? 'más' : 'menos'} ${Math.abs(value).toFixed(2)} grados`;
            } else if (unit.includes('USD')) {
                formattedValue = `${value.toLocaleString()} dólares`;
            } else if (value >= 1000000000) {
                formattedValue = `${(value / 1000000000).toFixed(1)} mil millones`;
            } else if (value >= 1000000) {
                formattedValue = `${(value / 1000000).toFixed(1)} millones`;
            } else {
                formattedValue = value.toLocaleString();
            }
            
            // Create announcement for screen readers
            const regionText = this.currentFilter !== 'global' ? ` en ${this.currentFilter}` : '';
            const announcement = `Año ${year}${regionText}, ${this.getValueFieldName()}: ${formattedValue}`;
            this.announceToScreenReader(announcement);
        });
    }
    
    updateYearLabel(year) {
        if (this.elements.yearLabel) {
            this.elements.yearLabel.textContent = year || '---';
        }
    }
    
    highlightDataPoint(index) {
        if (!this.chart) return;
        
        const chartData = this.prepareChartData();
        
        // Show data progressively up to current index
        const currentData = chartData.values.slice(0, index + 1);
        const currentYears = chartData.years.slice(0, index + 1);
        
        const unit = this.datasetData.metadata.unit || '';
        const isTemperature = unit.includes('°C');
        
        const option = {
            xAxis: {
                data: currentYears
            },
            series: [{
                data: currentData,
                markPoint: {
                    data: [{
                        coord: [index, chartData.values[index]],
                        symbol: 'circle',
                        symbolSize: 12,
                        itemStyle: {
                            color: '#ef4444',
                            borderColor: '#ffffff',
                            borderWidth: 3,
                            shadowBlur: 5,
                            shadowColor: 'rgba(0,0,0,0.3)'
                        },
                        label: {
                            show: true,
                            position: 'top',
                            formatter: (params) => {
                                const value = params.data.coord[1];
                                if (unit.includes('%')) {
                                    return `${value.toFixed(1)}%`;
                                } else if (isTemperature) {
                                    return `${value > 0 ? '+' : ''}${value.toFixed(2)}°C`;
                                } else if (unit.includes('USD')) {
                                    return `$${value.toLocaleString()}`;
                                } else if (value >= 1000000000) {
                                    return `${(value / 1000000000).toFixed(1)}B`;
                                } else if (value >= 1000000) {
                                    return `${(value / 1000000).toFixed(1)}M`;
                                } else if (value >= 1000) {
                                    return `${(value / 1000).toFixed(1)}K`;
                                }
                                return value.toLocaleString();
                            },
                            color: '#404040',
                            fontWeight: 'bold',
                            fontSize: 12,
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderColor: '#ccc',
                            borderWidth: 1,
                            borderRadius: 4,
                            padding: [4, 8]
                        }
                    }]
                }
            }]
        };
        
        this.chart.setOption(option, false);
    }
    
    toggleAnimation() {
        if (this.isPlaying) {
            this.stopAnimation();
        } else {
            this.startAnimation();
        }
    }
    
    startAnimation() {
        this.isPlaying = true;
        this.updatePlayButton();
        
        const chartData = this.prepareChartData();
        const totalFrames = chartData.years.length;
        let currentFrame = 0;
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            this.currentIndex = currentFrame;
            this.elements.yearSlider.value = currentFrame;
            this.updateYearLabel(chartData.years[currentFrame]);
            this.highlightDataPoint(currentFrame);
            
            currentFrame++;
            
            if (currentFrame >= totalFrames) {
                this.stopAnimation();
                return;
            }
            
            // Animate at ~3 FPS for better visualization
            setTimeout(() => {
                this.animationId = requestAnimationFrame(animate);
            }, 333);
        };
        
        // Start from beginning for animation
        this.currentIndex = 0;
        this.elements.yearSlider.value = 0;
        this.updateYearLabel(chartData.years[0]);
        this.highlightDataPoint(0);
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    stopAnimation() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.updatePlayButton();
    }
    
    updatePlayButton() {
        const icon = this.elements.playButton.querySelector('i');
        if (this.isPlaying) {
            icon.setAttribute('data-lucide', 'pause');
            this.elements.playButton.setAttribute('aria-label', 'Pausar animación');
            this.elements.playButton.setAttribute('title', 'Pausar');
        } else {
            icon.setAttribute('data-lucide', 'play');
            this.elements.playButton.setAttribute('aria-label', 'Reproducir animación temporal');
            this.elements.playButton.setAttribute('title', 'Reproducir');
        }
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    updateMetadata() {
        // Update title (H1 and document)
        this.elements.title.textContent = this.currentDatasetInfo.title;
        try {
            const siteName = 'Observatorio de Estadísticas';
            document.title = `${this.currentDatasetInfo.title} - ${siteName}`;
        } catch (_) { /* noop */ }
        
        // Update metadata section
        if (this.datasetData.metadata) {
            const metadata = this.datasetData.metadata;
            
            this.elements.description.textContent = metadata.description || this.currentDatasetInfo.description;
            this.elements.temporalCoverage.textContent = metadata.temporal_coverage || this.currentDatasetInfo.temporal_coverage;
            this.elements.spatialCoverage.textContent = metadata.spatial_coverage || this.currentDatasetInfo.spatial_coverage;
            this.elements.source.textContent = metadata.source || 'Fuente no especificada';
            this.elements.updated.textContent = metadata.updated || this.currentDatasetInfo.last_updated;
            
            // Update dataset info section
            this.elements.sourceInfo.textContent = metadata.source || 'Fuente no especificada';
            this.elements.lastUpdated.textContent = metadata.updated || this.currentDatasetInfo.last_updated;
            
            // Update fields list
            this.updateFieldsList();
        }
        
        // Update download link
        this.elements.downloadLink.href = this.currentDatasetInfo.file_path;
        this.elements.downloadLink.download = `${this.currentDatasetInfo.id}.json`;
        
        // Update canonical URL to include dataset id for SEO
        try {
            const canonicalHref = `${window.location.origin}/dataset.html?id=${this.currentDatasetInfo.id}`;
            let link = document.querySelector('link[rel="canonical"]');
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
            }
            link.setAttribute('href', canonicalHref);
        } catch (_) { /* noop */ }

        // Update meta description and social tags
        try {
            const desc = (this.datasetData.metadata && this.datasetData.metadata.description) || this.currentDatasetInfo.description || '';
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', desc);

            const title = this.currentDatasetInfo.title;
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', title);
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', desc);
            const twTitle = document.querySelector('meta[name="twitter:title"]');
            if (twTitle) twTitle.setAttribute('content', title);
            const twDesc = document.querySelector('meta[name="twitter:description"]');
            if (twDesc) twDesc.setAttribute('content', desc);
        } catch (_) { /* noop */ }

        // Show metadata
        this.elements.metadata.classList.remove('hidden');
        this.elements.datasetInfo.classList.remove('hidden');
    }
    
    updateFieldsList() {
        if (!this.datasetData.fields) return;
        
        this.elements.fieldsList.innerHTML = '';
        
        this.datasetData.fields.forEach(field => {
            const fieldElement = document.createElement('div');
            fieldElement.className = 'text-sm';
            fieldElement.innerHTML = `
                <span class="font-medium text-neutral-900 dark:text-white">${field.name}</span>
                <span class="text-neutral-600 dark:text-neutral-300"> (${field.type})</span>
                ${field.description ? `<br><span class="text-neutral-500 dark:text-neutral-400 text-xs">${field.description}</span>` : ''}
            `;
            this.elements.fieldsList.appendChild(fieldElement);
        });
    }
    
    showContent() {
        this.elements.loading.classList.add('hidden');
        this.elements.errorState.classList.add('hidden');
        this.elements.chartContainer.classList.remove('hidden');
        
        // Force chart resize after showing content
        setTimeout(() => {
            if (this.chart) {
                this.chart.resize();
            }
        }, 200);
    }
    
    showError(message) {
        this.elements.loading.classList.add('hidden');
        this.elements.chartContainer.classList.add('hidden');
        this.elements.errorState.classList.remove('hidden');
        
        // Enhanced error message with recovery options
        if (message.includes('No se especificó un ID de dataset')) {
            this.elements.errorMessage.innerHTML = `
                <div class="text-center">
                    <h3 class="text-lg font-semibold mb-2">No se especificó un dataset</h3>
                    <p class="mb-4">No se pudo identificar qué dataset mostrar. Esto puede ocurrir por:</p>
                    <ul class="text-left mb-4 space-y-1">
                        <li>• La URL no contiene un ID de dataset válido</li>
                        <li>• Hubo un problema con la redirección del servidor</li>
                        <li>• Se accedió directamente a esta página</li>
                    </ul>
                    <div class="space-y-2">
                        <button onclick="window.history.back()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2">
                            Volver atrás
                        </button>
                        <a href="/" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                            Ver todos los datasets
                        </a>
                    </div>
                </div>
            `;
        } else {
            this.elements.errorMessage.textContent = message;
        }
        
        // Update page title to show error
        this.elements.title.textContent = 'Error al cargar dataset';
        document.title = 'Error - Observatorio de Estadísticas';
    }
    
    // Announce changes to screen readers
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    // Cleanup method
    destroy() {
        if (this.chart) {
            this.chart.dispose();
        }
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove keyboard event listener
        document.removeEventListener('keydown', this.handleKeydown);
        
        window.removeEventListener('resize', this.handleResize);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance
    window.datasetViewer = new DatasetViewer();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.datasetViewer) {
        window.datasetViewer.destroy();
    }
});
