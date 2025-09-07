#!/usr/bin/env python3

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Agregar headers CORS para evitar problemas con fetch
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Cambiar al directorio del script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"🚀 Iniciando servidor local en puerto {PORT}")
    print(f"📁 Directorio: {os.getcwd()}")
    print(f"🌐 URL: http://localhost:{PORT}")
    print(f"📊 Datasets: http://localhost:{PORT}/dataset.html")
    print()
    print("Para probar un dataset específico:")
    print(f"http://localhost:{PORT}/dataset.html?id=metaverso_vr_v2")
    print(f"http://localhost:{PORT}/dataset.html?id=ia_generativa_v2")
    print()
    print("Presiona Ctrl+C para detener el servidor")
    print("-" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            # Abrir navegador automáticamente
            webbrowser.open(f'http://localhost:{PORT}')
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
        sys.exit(0)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Error: Puerto {PORT} ya está en uso")
            print(f"Prueba con otro puerto o detén el proceso que usa el puerto {PORT}")
        else:
            print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
