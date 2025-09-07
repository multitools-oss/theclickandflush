#!/usr/bin/env node

/**
 * Script para generar sitemaps automáticamente
 * Uso: node generate_sitemap.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = 'https://theclickandflush.com';
const OUTPUT_DIR = './';

// Cargar catálogo de datasets
function loadCatalog() {
    try {
        const catalogPath = path.join(__dirname, 'data', 'catalog.json');
        const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        return catalogData;
    } catch (error) {
        console.error('Error loading catalog:', error);
        return null;
    }
}

// Generar sitemap principal
function generateMainSitemap(catalog) {
    const currentDate = new Date().toISOString().split('T')[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

    <!-- Página principal - Español -->
    <url>
        <loc>${BASE_URL}/</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
        <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/?lang=en" />
        <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/" />
    </url>

    <!-- Página principal - Inglés -->
    <url>
        <loc>${BASE_URL}/?lang=en</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
        <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/" />
        <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/?lang=en" />
    </url>

    <!-- Visualización de datasets -->
    <url>
        <loc>${BASE_URL}/dataset.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>

`;

    // Agregar datasets
    if (catalog && catalog.datasets) {
        catalog.datasets.forEach(dataset => {
            const priority = dataset.featured ? '0.9' : '0.7';
            const changefreq = dataset.update_frequency === 'Monthly' ? 'monthly' : 
                             dataset.update_frequency === 'Weekly' ? 'weekly' : 'monthly';
            
            const filePath = dataset.file_path.startsWith('/') ? dataset.file_path.substring(1) : dataset.file_path;
            const datasetId = path.basename(filePath, '.json');
            
            xml += `    <!-- ${dataset.title} -->
    <url>
        <loc>${BASE_URL}/dataset.html?id=${datasetId}</loc>
        <lastmod>${dataset.last_updated}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>

`;
        });
    }

    xml += `    <!-- Páginas legales -->
    <url>
        <loc>${BASE_URL}/legal.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
    </url>

    <url>
        <loc>${BASE_URL}/privacy.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
    </url>

</urlset>`;

    return xml;
}

// Generar sitemap index
function generateSitemapIndex() {
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    
    <sitemap>
        <loc>${BASE_URL}/sitemap.xml</loc>
        <lastmod>${currentDate}</lastmod>
    </sitemap>
    
    <sitemap>
        <loc>${BASE_URL}/sitemap_datasets.xml</loc>
        <lastmod>${currentDate}</lastmod>
    </sitemap>
    
</sitemapindex>`;
}

// Función principal
function main() {
    console.log('🗺️  Generando sitemaps...');
    
    // Cargar catálogo
    const catalog = loadCatalog();
    if (!catalog) {
        console.error('❌ No se pudo cargar el catálogo');
        process.exit(1);
    }
    
    console.log(`📊 Encontrados ${catalog.datasets.length} datasets`);
    
    // Generar sitemap principal
    const mainSitemap = generateMainSitemap(catalog);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), mainSitemap);
    console.log('✅ sitemap.xml generado');
    
    // Generar sitemap index
    const sitemapIndex = generateSitemapIndex();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap_index.xml'), sitemapIndex);
    console.log('✅ sitemap_index.xml generado');
    
    console.log('🎉 Sitemaps generados exitosamente');
    console.log(`📈 Total URLs: ${catalog.datasets.length + 5} (${catalog.datasets.length} datasets + 5 páginas)`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { generateMainSitemap, generateSitemapIndex, loadCatalog };
