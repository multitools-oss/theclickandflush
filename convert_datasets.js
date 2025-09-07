#!/usr/bin/env node

/**
 * Script para convertir datasets con estructura problemática
 * De múltiples métricas a summary + breakdown
 */

const fs = require('fs');
const path = require('path');

// Datasets que necesitan conversión manual (ya convertidos)
const CONVERTED_DATASETS = [
    'ia_generativa.v2.json',
    'creadores_contenido.v2.json', 
    'trabajos_vs_ia.v2.json',
    'salud_mental_pandemia.v2.json',
    'metaverso_vr.v2.json',
    'fenomeno_podcasts.v2.json',
    'migracion_climatica.v2.json'
];

function findProblematicDatasets() {
    const dataDir = path.join(__dirname, 'data');
    const categories = fs.readdirSync(dataDir);
    const problematic = [];
    
    categories.forEach(category => {
        const categoryPath = path.join(dataDir, category);
        if (fs.statSync(categoryPath).isDirectory()) {
            const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.v2.json'));
            
            files.forEach(file => {
                if (CONVERTED_DATASETS.includes(file)) {
                    return; // Skip already converted
                }
                
                const filePath = path.join(categoryPath, file);
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    // Check if it has problematic structure
                    if (data.data && !data.summary && !data.breakdown) {
                        const firstRecord = data.data[0];
                        if (firstRecord && !firstRecord.value && Object.keys(firstRecord).length > 2) {
                            problematic.push({
                                file,
                                path: filePath,
                                category,
                                id: data.metadata.id,
                                title: data.metadata.title,
                                fields: Object.keys(firstRecord)
                            });
                        }
                    }
                } catch (error) {
                    console.log(`⚠️  Error reading ${file}: ${error.message}`);
                }
            });
        }
    });
    
    return problematic;
}

function main() {
    console.log('🔍 Buscando datasets con estructura problemática...\n');
    
    const problematic = findProblematicDatasets();
    
    if (problematic.length === 0) {
        console.log('🎉 No se encontraron datasets con problemas de estructura');
        return;
    }
    
    console.log(`📊 Encontrados ${problematic.length} datasets con problemas:\n`);
    
    problematic.forEach((dataset, i) => {
        console.log(`${i + 1}. ${dataset.file}`);
        console.log(`   📁 Categoría: ${dataset.category}`);
        console.log(`   📋 ID: ${dataset.id}`);
        console.log(`   📝 Título: ${dataset.title}`);
        console.log(`   🔧 Campos: ${dataset.fields.join(', ')}`);
        console.log('');
    });
    
    console.log('💡 RECOMENDACIONES:');
    console.log('');
    console.log('Estos datasets usan estructura de "múltiples métricas" que causa');
    console.log('que las gráficas se muestren como líneas rectas en el suelo.');
    console.log('');
    console.log('Para arreglarlos, necesitan ser convertidos a estructura:');
    console.log('- summary: datos agregados por año');
    console.log('- breakdown: datos desglosados por métrica');
    console.log('- breakdown_key: campo para filtrar');
    console.log('');
    console.log('Datasets ya convertidos:');
    CONVERTED_DATASETS.forEach(file => {
        console.log(`✅ ${file}`);
    });
}

if (require.main === module) {
    main();
}
