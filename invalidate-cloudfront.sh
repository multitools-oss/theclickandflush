#!/bin/bash

# Script para invalidar CloudFront
# Uso: ./invalidate-cloudfront.sh [DISTRIBUTION_ID]

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔥 CloudFront Invalidation Script${NC}"
echo ""

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    exit 1
fi

# Verificar credenciales
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI no está configurado${NC}"
    echo "Ejecuta: aws configure"
    exit 1
fi

# Distribution ID
DISTRIBUTION_ID="$1"

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}🔍 Buscando distribuciones de CloudFront...${NC}"
    
    # Listar distribuciones
    aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Comment]' --output table
    
    echo ""
    echo -e "${YELLOW}💡 Uso: $0 <DISTRIBUTION_ID>${NC}"
    echo "Ejemplo: $0 E1234567890ABC"
    exit 1
fi

echo -e "${BLUE}📋 Distribution ID: $DISTRIBUTION_ID${NC}"

# Paths a invalidar
PATHS='[
    "/*"
]'

# Paths específicos para datasets (más económico)
SPECIFIC_PATHS='[
    "/data/*",
    "/dataset.html",
    "/assets/dataset.js",
    "/assets/main.js",
    "/index.html"
]'

echo ""
echo -e "${YELLOW}Selecciona el tipo de invalidación:${NC}"
echo "1) Invalidar todo (/*) - Más caro pero garantizado"
echo "2) Invalidar archivos específicos - Más barato"
echo ""
read -p "Opción (1 o 2): " OPTION

case $OPTION in
    1)
        SELECTED_PATHS="$PATHS"
        echo -e "${YELLOW}📤 Invalidando todo el sitio...${NC}"
        ;;
    2)
        SELECTED_PATHS="$SPECIFIC_PATHS"
        echo -e "${YELLOW}📤 Invalidando archivos específicos...${NC}"
        ;;
    *)
        echo -e "${RED}❌ Opción inválida${NC}"
        exit 1
        ;;
esac

# Crear invalidación
echo ""
echo -e "${BLUE}🚀 Creando invalidación...${NC}"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --invalidation-batch "Paths={Quantity=$(echo "$SELECTED_PATHS" | jq length),Items=$(echo "$SELECTED_PATHS")},CallerReference=$(date +%s)" \
    --query 'Invalidation.Id' \
    --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Invalidación creada exitosamente${NC}"
    echo -e "${BLUE}📋 Invalidation ID: $INVALIDATION_ID${NC}"
    echo ""
    echo -e "${YELLOW}⏳ Monitoreando progreso...${NC}"
    
    # Monitorear progreso
    while true; do
        STATUS=$(aws cloudfront get-invalidation \
            --distribution-id "$DISTRIBUTION_ID" \
            --id "$INVALIDATION_ID" \
            --query 'Invalidation.Status' \
            --output text)
        
        echo -e "${BLUE}📊 Estado: $STATUS${NC}"
        
        if [ "$STATUS" = "Completed" ]; then
            echo -e "${GREEN}🎉 Invalidación completada!${NC}"
            break
        elif [ "$STATUS" = "InProgress" ]; then
            echo -e "${YELLOW}⏳ En progreso... (esperando 30s)${NC}"
            sleep 30
        else
            echo -e "${RED}❌ Estado desconocido: $STATUS${NC}"
            break
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ Cache de CloudFront invalidado${NC}"
    echo -e "${BLUE}🌐 Prueba tu sitio: https://theclickandflush.com${NC}"
    
else
    echo -e "${RED}❌ Error creando invalidación${NC}"
    exit 1
fi
