import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const downloadsDir = path.join(rootDir, 'public', 'downloads');

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

if (!fs.existsSync(distDir)) {
  console.log('Dist does not exist, building first...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
}

const htmlTemplate = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const assets = fs.readdirSync(path.join(distDir, 'assets'));
const cssFileName = assets.find(f => f.endsWith('.css'));
const jsFileName = assets.find(f => f.endsWith('.js'));

if (!cssFileName || !jsFileName) {
  console.error('Assets not found in dist/assets');
  process.exit(1);
}

const cssContent = fs.readFileSync(path.join(distDir, 'assets', cssFileName), 'utf8');
const jsContent = fs.readFileSync(path.join(distDir, 'assets', jsFileName), 'utf8');

// 1. Clean template by removing external links and script tags
let singleHtml = htmlTemplate
  .replace(/<script[^>]*><\/script>/gi, '')
  .replace(/<link[^>]*stylesheet[^>]*>/gi, '');

// 2. Inject CSS inside <head>
singleHtml = singleHtml.replace('</head>', '<style>\n' + cssContent + '\n</style>\n</head>');

// 3. Inject JS at the end of <body> AFTER <div id="root"></div>
// Use standard hex escape \x3c for <script or </script so the HTML parser never breaks
const safeJsContent = jsContent.replace(/<(\/?)script/gi, '\\x3c$1script');
singleHtml = singleHtml.replace('</body>', () => '<script>\n' + safeJsContent + '\n</script>\n</body>');

const htmlOutPath = path.join(downloadsDir, 'InverTrack_Web.html');
fs.writeFileSync(htmlOutPath, singleHtml, 'utf8');
console.log('Generated standalone InverTrack_Web.html (' + (singleHtml.length / 1024).toFixed(1) + ' KB)');

// Create PC app package with python
const pyScript = `
import os, zipfile

downloads_dir = r"${downloadsDir}"
html_path = os.path.join(downloads_dir, 'InverTrack_Web.html')
with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

bat_content = '''@echo off
setlocal
title InverTrack AI - Cartera de Inversiones
cd /d "%~dp0"
set "APP_FILE=%~dp0InverTrack.html"

where msedge >nul 2>nul
if %ERRORLEVEL% equ 0 (
    start "" msedge --app="file:///%APP_FILE:\\=/%" --window-size=1300,850
    exit /b
)

where chrome >nul 2>nul
if %ERRORLEVEL% equ 0 (
    start "" chrome --app="file:///%APP_FILE:\\=/%" --window-size=1300,850
    exit /b
)

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="file:///%APP_FILE:\\=/%" --window-size=1300,850
    exit /b
)
if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="file:///%APP_FILE:\\=/%" --window-size=1300,850
    exit /b
)
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="file:///%APP_FILE:\\=/%" --window-size=1300,850
    exit /b
)
if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" --app="file:///%APP_FILE:\\=/%" --window-size=1300,850
    exit /b
)

start "" "%APP_FILE%"
'''

vbs_content = '''Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "InverTrack-App.bat", 0, False
'''

sh_content = '''#!/usr/bin/env bash
DIR="$( cd "$( dirname "\\$0" )" && pwd )"
HTML_FILE="\\$DIR/InverTrack.html"
if command -v open >/dev/null 2>&1; then
    open "\\$HTML_FILE"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "\\$HTML_FILE"
fi
'''

readme_content = '''=====================================================
INVERTRACK AI - APLICACION PARA PC Y WEB
=====================================================

Bienvenido a tu Gestor de Cartera de Inversiones InverTrack AI.
La aplicacion es 100% autonoma y funciona sin conexion ni dependencias.

OPCION 1: ABRIR DIRECTAMENTE EN TU NAVEGADOR (Recomendada)
- Haz doble clic en "InverTrack.html".
- Se abrira inmediatamente en tu navegador predeterminado (Chrome, Edge, Firefox, Brave, Safari).
- Veras la interfaz completa con tu cartera, graficos, tablas y lectura de boletos.

OPCION 2: ABRIR EN MODO VENTANA DE ESCRITORIO (Windows)
- Haz doble clic en "InverTrack-App.bat" (o "InverTrack-App.vbs").
- Se abrira en una ventana propia de aplicacion independiente, sin barras de navegacion ni pestanas.

OPCION 3: MAC O LINUX
- Haz doble clic en "InverTrack-Mac-Linux.sh" o simplemente abre "InverTrack.html".

TUS DATOS:
- Tus carteras, transacciones y precios se guardan automaticamente de forma local en tu computadora.
- Nadie mas tiene acceso a tus finanzas (100% privado).
=====================================================
'''

zip_path = os.path.join(downloads_dir, 'InverTrack-PC-App.zip')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipf.writestr('InverTrack-PC-App/InverTrack.html', html_content)
    zipf.writestr('InverTrack-PC-App/InverTrack-App.bat', bat_content)
    zipf.writestr('InverTrack-PC-App/InverTrack-App.vbs', vbs_content)
    zipf.writestr('InverTrack-PC-App/InverTrack-Mac-Linux.sh', sh_content)
    zipf.writestr('InverTrack-PC-App/LEEME-INSTRUCCIONES.txt', readme_content)

print('Packaged InverTrack-PC-App.zip (' + str(round(os.path.getsize(zip_path) / 1024, 1)) + ' KB)')
`;

fs.writeFileSync(path.join(rootDir, 'temp_pack.py'), pyScript, 'utf8');
execSync('python3 temp_pack.py', { stdio: 'inherit', cwd: rootDir });
fs.unlinkSync(path.join(rootDir, 'temp_pack.py'));
console.log('All downloads ready and verified in public/downloads!');
