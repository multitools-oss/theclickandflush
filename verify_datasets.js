#!/usr/bin/env node

/**
 * Script para verificar la integridad de todos los datasets
 */

const fs = require('fs');
const path = require('path');

function verifyDataset(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        const filename = path.basename(filePath);
        
        console.log(`\n🔍 Verificando: ${filename}`);
        
        // Verificar estructura básica
        if (!data.metadata) {
            console.log(`   ❌ Falta metadata`);
            return false;
        }
        
        if (!data.fields) {
            console.log(`   ❌ Falta fields`);
            return false;
        }
        
        // Verificar que tiene datos
        const hasData = data.data || data.summary || data.breakdown;
        if (!hasData) {
            console.log(`   ❌ No tiene datos (data, summary o breakdown)`);
            return false;
        }
        
        // Verificar estructura de datos
        let dataArray = [];
        if (data.data) {
            dataArray = data.data;
            console.log(`   📊 Estructura: data (${dataArray.length} registros)`);
        } else if (data.summary) {
            dataArray = data.summary;
            console.log(`   📊 Estructura: summary (${dataArray.length} registros)`);
            
            if (data.breakdown) {
                console.log(`   📊 + breakdown (${data.breakdown.length} registros)`);
            }
        }
        
        // Verificar que los datos tienen la estructura correcta
        if (dataArray.length > 0) {
            const firstRecord = dataArray[0];
            
            // Verificar que tiene campo year
            if (!firstRecord.year && !firstRecord.year_range) {
                console.log(`   ⚠️  No tiene campo 'year' en los datos`);
            }
            
            // Verificar que tiene campo value
            if (!firstRecord.value && typeof firstRecord.value !== 'number') {
                console.log(`   ⚠️  No tiene campo 'value' numérico en los datos`);
            }
            
            console.log(`   ✅ Estructura válida`);
            console.log(`   📈 Primer registro:`, Object.keys(firstRecord).join(', '));
        }
        
        return true;
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

function main() {
    console.log('🔍 Verificando integridad de todos los datasets...');
    
    const dataDir = path.join(__dirname, 'data');
    const categories = fs.readdirSync(dataDir);
    
    let totalDatasets = 0;
    let validDatasets = 0;
    let problemDatasets = [];
    
    categories.forEach(category => {
        const categoryPath = path.join(dataDir, category);
        if (fs.statSync(categoryPath).isDirectory()) {
            const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.v2.json'));
            
            files.forEach(file => {
                totalDatasets++;
                const filePath = path.join(categoryPath, file);
                
                if (verifyDataset(filePath)) {
                    validDatasets++;
                } else {
                    problemDatasets.push(`${category}/${file}`);
                }
            });
        }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 RESUMEN:`);
    console.log(`   Total datasets: ${totalDatasets}`);
    console.log(`   Válidos: ${validDatasets}`);
    console.log(`   Con problemas: ${problemDatasets.length}`);
    
    if (problemDatasets.length > 0) {
        console.log('\n❌ Datasets con problemas:');
        problemDatasets.forEach(dataset => {
            console.log(`   - ${dataset}`);
        });
    }
    
    console.log('\n🎯 Recomendación: Revisa los datasets con problemas para asegurar que tengan:');
    console.log('   1. Campo "fields" definido');
    console.log('   2. Datos en "data", "summary" o "breakdown"');
    console.log('   3. Campo "year" en los registros de datos');
    console.log('   4. Campo "value" numérico en los registros');
}

if (require.main === module) {
    main();
}
