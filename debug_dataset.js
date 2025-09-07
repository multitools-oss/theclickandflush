#!/usr/bin/env node

/**
 * Script para debuggear un dataset específico
 * Uso: node debug_dataset.js metaverso_vr_v2
 */

const fs = require('fs');
const path = require('path');

function findDatasetFile(datasetId) {
    const dataDir = path.join(__dirname, 'data');
    const categories = fs.readdirSync(dataDir);
    
    for (const category of categories) {
        const categoryPath = path.join(dataDir, category);
        if (fs.statSync(categoryPath).isDirectory()) {
            const files = fs.readdirSync(categoryPath);
            for (const file of files) {
                if (file.includes(datasetId) && file.endsWith('.json')) {
                    return path.join(categoryPath, file);
                }
            }
        }
    }
    return null;
}

function debugDataset(datasetId) {
    console.log(`🔍 Debuggeando dataset: ${datasetId}`);
    console.log('='.repeat(50));
    
    // Buscar archivo
    const filePath = findDatasetFile(datasetId);
    if (!filePath) {
        console.log(`❌ Dataset no encontrado: ${datasetId}`);
        return false;
    }
    
    console.log(`📁 Archivo: ${filePath}`);
    
    try {
        // Leer y parsear JSON
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        console.log('\n📊 ESTRUCTURA DEL DATASET:');
        console.log('-'.repeat(30));
        
        // Verificar metadata
        if (data.metadata) {
            console.log(`✅ metadata.id: ${data.metadata.id}`);
            console.log(`✅ metadata.title: ${data.metadata.title}`);
            console.log(`✅ metadata.has_filters: ${data.metadata.has_filters || 'undefined'}`);
            console.log(`✅ metadata.filter_field: ${data.metadata.filter_field || 'undefined'}`);
            console.log(`✅ metadata.breakdown_key: ${data.metadata.breakdown_key || 'undefined'}`);
        } else {
            console.log(`❌ Falta metadata`);
        }
        
        // Verificar fields
        if (data.fields) {
            console.log(`✅ fields: ${data.fields.length} campos definidos`);
            data.fields.forEach((field, i) => {
                console.log(`   ${i+1}. ${field.name} (${field.type}): ${field.description}`);
            });
        } else {
            console.log(`❌ Falta campo "fields"`);
        }
        
        // Verificar datos
        console.log('\n📈 DATOS:');
        console.log('-'.repeat(30));
        
        if (data.data) {
            console.log(`✅ data: ${data.data.length} registros`);
            if (data.data.length > 0) {
                console.log(`   Primer registro:`, Object.keys(data.data[0]).join(', '));
                console.log(`   Ejemplo:`, JSON.stringify(data.data[0], null, 2));
            }
        }
        
        if (data.summary) {
            console.log(`✅ summary: ${data.summary.length} registros`);
            if (data.summary.length > 0) {
                console.log(`   Primer registro:`, Object.keys(data.summary[0]).join(', '));
            }
        }
        
        if (data.breakdown) {
            console.log(`✅ breakdown: ${data.breakdown.length} registros`);
            if (data.breakdown.length > 0) {
                console.log(`   Primer registro:`, Object.keys(data.breakdown[0]).join(', '));
            }
        }
        
        if (!data.data && !data.summary && !data.breakdown) {
            console.log(`❌ No tiene datos (data, summary o breakdown)`);
        }
        
        // Verificar compatibilidad con visualizador
        console.log('\n🎯 COMPATIBILIDAD CON VISUALIZADOR:');
        console.log('-'.repeat(30));
        
        const hasFields = !!data.fields;
        const hasData = !!(data.data || data.summary || data.breakdown);
        const hasCorrectStructure = data.summary && data.breakdown && data.metadata.breakdown_key;
        const hasSimpleStructure = data.data && data.metadata.filter_field;
        
        console.log(`✅ Tiene campo "fields": ${hasFields}`);
        console.log(`✅ Tiene datos: ${hasData}`);
        console.log(`✅ Estructura summary+breakdown: ${hasCorrectStructure}`);
        console.log(`✅ Estructura simple con filtros: ${hasSimpleStructure}`);
        
        if (hasFields && hasData && (hasCorrectStructure || hasSimpleStructure)) {
            console.log('\n🎉 DATASET COMPATIBLE - Debería funcionar correctamente');
        } else {
            console.log('\n⚠️  DATASET PUEDE TENER PROBLEMAS');
            if (!hasFields) console.log('   - Falta campo "fields"');
            if (!hasData) console.log('   - No tiene datos');
            if (!hasCorrectStructure && !hasSimpleStructure) {
                console.log('   - Estructura de datos no compatible');
            }
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error parseando JSON: ${error.message}`);
        return false;
    }
}

function main() {
    const datasetId = process.argv[2];
    
    if (!datasetId) {
        console.log('❌ Error: Debes proporcionar el ID del dataset');
        console.log('');
        console.log('Uso: node debug_dataset.js <dataset_id>');
        console.log('');
        console.log('Ejemplos:');
        console.log('  node debug_dataset.js metaverso_vr_v2');
        console.log('  node debug_dataset.js ia_generativa_v2');
        console.log('  node debug_dataset.js poblacion_mundial_v2');
        process.exit(1);
    }
    
    debugDataset(datasetId);
}

if (require.main === module) {
    main();
}
