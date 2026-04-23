#!/bin/bash

# Inicializar Git
git init

# Crear .gitignore si no existe
if [ ! -f .gitignore ]; then
  cat <<EOF > .gitignore
node_modules/
.expo/
dist/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
EOF
fi

# Agregar archivos
git add .

# Primer commit
git commit -m "Initial commit: SwiftRun App with Stitch Design & MCP Server"

echo "Repositorio Git inicializado correctamente."
echo "Para subir a GitHub, usa:"
echo "git remote add origin <tu_url_de_repo>"
echo "git push -u origin main"
