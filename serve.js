#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Archivo no encontrado</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Error del servidor: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🚀 Servidor local iniciado');
    console.log(`📁 Directorio: ${process.cwd()}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Datasets: http://localhost:${PORT}/dataset.html`);
    console.log('');
    console.log('Para probar datasets específicos:');
    console.log(`http://localhost:${PORT}/dataset.html?id=metaverso_vr_v2`);
    console.log(`http://localhost:${PORT}/dataset.html?id=ia_generativa_v2`);
    console.log('');
    console.log('Presiona Ctrl+C para detener');
    console.log('-'.repeat(50));
    
    // Abrir navegador (solo en sistemas que lo soporten)
    const start = process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${start} http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Error: Puerto ${PORT} ya está en uso`);
        console.log(`Prueba con otro puerto o detén el proceso que usa el puerto ${PORT}`);
    } else {
        console.log(`❌ Error del servidor: ${err}`);
    }
});
