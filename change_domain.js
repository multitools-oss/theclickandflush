#!/usr/bin/env node

/**
 * Script para cambiar el dominio en todos los archivos del proyecto
 * Uso: node change_domain.js tu-dominio-real.com
 */

const fs = require('fs');
const path = require('path');

const OLD_DOMAIN = 'observatorio-estadisticas.com';

// Archivos que contienen referencias al dominio
const FILES_TO_UPDATE = [
    'index.html',
    'dataset.html',
    'legal.html',
    'privacy.html',
    'robots.txt',
    'sitemap.xml',
    'sitemap_datasets.xml',
    'sitemap_index.xml',
    'generate_sitemap.js',
    'google-site-verification.html'
];

function updateDomainInFile(filePath, newDomain) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Archivo no encontrado: ${filePath}`);
            return false;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Reemplazar todas las ocurrencias del dominio antiguo
        content = content.replace(new RegExp(OLD_DOMAIN, 'g'), newDomain);
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            const changes = (originalContent.match(new RegExp(OLD_DOMAIN, 'g')) || []).length;
            console.log(`✅ ${path.basename(filePath)}: ${changes} cambios`);
            return true;
        } else {
            console.log(`ℹ️  ${path.basename(filePath)}: sin cambios`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error actualizando ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    const newDomain = process.argv[2];
    
    if (!newDomain) {
        console.error('❌ Error: Debes proporcionar el nuevo dominio');
        console.log('');
        console.log('Uso: node change_domain.js tu-dominio-real.com');
        console.log('');
        console.log('Ejemplos:');
        console.log('  node change_domain.js miobservatorio.com');
        console.log('  node change_domain.js datos.miempresa.com');
        console.log('  node change_domain.js localhost:3000');
        process.exit(1);
    }
    
    // Validar formato básico del dominio
    if (newDomain.includes('http://') || newDomain.includes('https://')) {
        console.error('❌ Error: No incluyas http:// o https://, solo el dominio');
        console.log('Ejemplo correcto: midominio.com');
        process.exit(1);
    }
    
    console.log(`🔄 Cambiando dominio de "${OLD_DOMAIN}" a "${newDomain}"`);
    console.log('');
    
    let totalChanges = 0;
    let filesUpdated = 0;
    
    FILES_TO_UPDATE.forEach(fileName => {
        const filePath = path.join(__dirname, fileName);
        if (updateDomainInFile(filePath, newDomain)) {
            filesUpdated++;
        }
    });
    
    console.log('');
    console.log(`🎉 Proceso completado:`);
    console.log(`   📁 Archivos actualizados: ${filesUpdated}/${FILES_TO_UPDATE.length}`);
    console.log(`   🌐 Nuevo dominio: ${newDomain}`);
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('   1. Verifica los cambios con: git diff');
    console.log('   2. Regenera los sitemaps: npm run generate:sitemap');
    console.log('   3. Sube los archivos a tu servidor');
    console.log('   4. Configura tu dominio real');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { updateDomainInFile };
