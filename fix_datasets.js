#!/usr/bin/env node

/**
 * Script para arreglar datasets que no tienen el campo "fields"
 */

const fs = require('fs');
const path = require('path');

// Datasets que necesitan ser arreglados con sus campos específicos
const DATASETS_TO_FIX = {
  'salud_mental_pandemia.v2.json': {
    fields: [
      { "name": "year", "type": "integer", "description": "Año del registro" },
      { "name": "global", "type": "number", "description": "Índice global de salud mental (0-100)" },
      { "name": "ansiedad", "type": "number", "description": "Diagnósticos de ansiedad (millones)" },
      { "name": "depresion", "type": "number", "description": "Diagnósticos de depresión (millones)" },
      { "name": "apps_meditacion", "type": "number", "description": "Usuarios de apps de meditación (millones)" },
      { "name": "terapia_online", "type": "number", "description": "Sesiones de terapia online (millones)" },
      { "name": "inversion_salud", "type": "number", "description": "Inversión en salud mental (miles de millones USD)" }
    ]
  },
  'migracion_climatica.v2.json': {
    fields: [
      { "name": "year", "type": "integer", "description": "Año del registro" },
      { "name": "global", "type": "number", "description": "Total global de desplazados climáticos (millones)" },
      { "name": "sequias", "type": "number", "description": "Desplazados por sequías (millones)" },
      { "name": "inundaciones", "type": "number", "description": "Desplazados por inundaciones (millones)" },
      { "name": "tormentas", "type": "number", "description": "Desplazados por tormentas (millones)" },
      { "name": "nivel_mar", "type": "number", "description": "Desplazados por subida del nivel del mar (millones)" },
      { "name": "otros", "type": "number", "description": "Desplazados por otros eventos climáticos (millones)" }
    ]
  },
  'records_temperatura.v2.json': {
    fields: [
      { "name": "year", "type": "integer", "description": "Año del registro" },
      { "name": "global", "type": "number", "description": "Temperatura máxima global promedio (°C)" },
      { "name": "africa", "type": "number", "description": "Temperatura máxima récord en África (°C)" },
      { "name": "america", "type": "number", "description": "Temperatura máxima récord en América (°C)" },
      { "name": "asia", "type": "number", "description": "Temperatura máxima récord en Asia (°C)" },
      { "name": "europa", "type": "number", "description": "Temperatura máxima récord en Europa (°C)" },
      { "name": "oceania", "type": "number", "description": "Temperatura máxima récord en Oceanía (°C)" }
    ]
  },
  'vehiculos_electricos_paises.v2.json': {
    fields: [
      { "name": "year", "type": "integer", "description": "Año del registro" },
      { "name": "global", "type": "number", "description": "Ventas globales de vehículos eléctricos (millones)" },
      { "name": "china", "type": "number", "description": "Ventas en China (millones)" },
      { "name": "europa", "type": "number", "description": "Ventas en Europa (millones)" },
      { "name": "usa", "type": "number", "description": "Ventas en Estados Unidos (millones)" },
      { "name": "otros", "type": "number", "description": "Ventas en otros países (millones)" }
    ]
  },
  'metaverso_vr.v2.json': {
    fields: [
      { "name": "year", "type": "integer", "description": "Año del registro" },
      { "name": "global", "type": "number", "description": "Usuarios globales de metaverso/VR (millones)" },
      { "name": "gaming", "type": "number", "description": "Usuarios en gaming VR (millones)" },
      { "name": "social", "type": "number", "description": "Usuarios en plataformas sociales VR (millones)" },
      { "name": "trabajo", "type": "number", "description": "Usuarios en trabajo/reuniones VR (millones)" },
      { "name": "educacion", "type": "number", "description": "Usuarios en educación VR (millones)" },
      { "name": "otros", "type": "number", "description": "Usuarios en otras aplicaciones VR (millones)" }
    ]
  },
  'fenomeno_podcasts.v2.json': {
    fields: [
      { "name": "year", "type": "integer", "description": "Año del registro" },
      { "name": "global", "type": "number", "description": "Oyentes globales de podcasts (millones)" },
      { "name": "spotify", "type": "number", "description": "Oyentes en Spotify (millones)" },
      { "name": "apple", "type": "number", "description": "Oyentes en Apple Podcasts (millones)" },
      { "name": "youtube", "type": "number", "description": "Oyentes en YouTube (millones)" },
      { "name": "otros", "type": "number", "description": "Oyentes en otras plataformas (millones)" }
    ]
  }
};

function fixDataset(filePath, fieldsConfig) {
  try {
    console.log(`🔧 Arreglando: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Verificar si ya tiene el campo fields
    if (data.fields) {
      console.log(`   ✅ Ya tiene campo fields`);
      return true;
    }
    
    // Agregar el campo fields después de metadata
    data.fields = fieldsConfig.fields;
    
    // Escribir el archivo actualizado
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`   ✅ Campo fields agregado`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔧 Arreglando datasets sin campo "fields"...\n');
  
  let fixed = 0;
  let total = 0;
  
  for (const [filename, config] of Object.entries(DATASETS_TO_FIX)) {
    total++;
    
    // Buscar el archivo en todas las carpetas
    const searchDirs = [
      'data/salud_futuro',
      'data/clima_extremo', 
      'data/tecnologia',
      'data/cultura_digital'
    ];
    
    let found = false;
    for (const dir of searchDirs) {
      const filePath = path.join(__dirname, dir, filename);
      if (fs.existsSync(filePath)) {
        if (fixDataset(filePath, config)) {
          fixed++;
        }
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`⚠️  No encontrado: ${filename}`);
    }
  }
  
  console.log(`\n🎉 Proceso completado:`);
  console.log(`   📁 Datasets arreglados: ${fixed}/${total}`);
  console.log(`   ✅ Ahora todos los datasets deberían funcionar`);
}

if (require.main === module) {
  main();
}
