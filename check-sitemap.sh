#!/bin/bash

# Script para verificar sitemap en producción

echo "🔍 VERIFICANDO SITEMAP EN PRODUCCIÓN"
echo "===================================="

DOMAIN="https://theclickandflush.com"

echo "🌐 Verificando acceso al sitemap..."
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/sitemap.xml")
echo "Status sitemap.xml: $SITEMAP_STATUS"

if [ "$SITEMAP_STATUS" = "200" ]; then
    echo "✅ Sitemap accesible"
    
    # Verificar content-type
    echo ""
    echo "📋 Verificando Content-Type..."
    CONTENT_TYPE=$(curl -s -I "$DOMAIN/sitemap.xml" | grep -i "content-type" | cut -d: -f2 | tr -d ' \r')
    echo "Content-Type: $CONTENT_TYPE"
    
    if [[ "$CONTENT_TYPE" == *"xml"* ]]; then
        echo "✅ Content-Type correcto"
    else
        echo "⚠️  Content-Type podría ser incorrecto"
    fi
    
    # Verificar tamaño
    echo ""
    echo "📊 Verificando contenido..."
    SITEMAP_SIZE=$(curl -s "$DOMAIN/sitemap.xml" | wc -c)
    URL_COUNT=$(curl -s "$DOMAIN/sitemap.xml" | grep -c "<loc>")
    
    echo "Tamaño del sitemap: $SITEMAP_SIZE bytes"
    echo "URLs encontradas: $URL_COUNT"
    
    if [ "$URL_COUNT" -gt 40 ]; then
        echo "✅ Sitemap contiene URLs esperadas"
    else
        echo "⚠️  Pocas URLs en el sitemap"
    fi
    
else
    echo "❌ Sitemap no accesible (Status: $SITEMAP_STATUS)"
fi

echo ""
echo "🤖 Verificando robots.txt..."
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/robots.txt")
echo "Status robots.txt: $ROBOTS_STATUS"

if [ "$ROBOTS_STATUS" = "200" ]; then
    echo "✅ robots.txt accesible"
    
    # Verificar que contiene referencia al sitemap
    if curl -s "$DOMAIN/robots.txt" | grep -q "sitemap.xml"; then
        echo "✅ robots.txt referencia el sitemap"
    else
        echo "⚠️  robots.txt no referencia el sitemap"
    fi
else
    echo "❌ robots.txt no accesible"
fi

echo ""
echo "🔍 HERRAMIENTAS DE VERIFICACIÓN:"
echo "================================"
echo "Google Search Console: https://search.google.com/search-console"
echo "Bing Webmaster Tools: https://www.bing.com/webmasters"
echo "Sitemap Validator: https://www.xml-sitemaps.com/validate-xml-sitemap.html"
echo ""
echo "Para probar tu sitemap:"
echo "curl -I $DOMAIN/sitemap.xml"
echo "curl -s $DOMAIN/sitemap.xml | head -20"
