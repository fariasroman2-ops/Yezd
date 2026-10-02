import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Monitor, 
  FileCode2, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  Laptop,
  Copy,
  Check,
  AlertCircle,
  FileText
} from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [downloadingWeb, setDownloadingWeb] = useState(false);
  const [downloadingPc, setDownloadingPc] = useState(false);
  const [copiedWebLink, setCopiedWebLink] = useState(false);
  const [copiedPcLink, setCopiedPcLink] = useState(false);
  const [copiedHtmlCode, setCopiedHtmlCode] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [isCopyingCode, setIsCopyingCode] = useState(false);

  // Compute absolute URLs for clean top-level downloads
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const webDownloadUrl = `${origin}/api/download/web`;
  const pcDownloadUrl = `${origin}/api/download/pc`;

  // Download with File System Access API or Blob fallback
  const triggerDownload = async (
    endpoint: string, 
    suggestedFilename: string, 
    mimeType: string,
    setLoading: (val: boolean) => void
  ) => {
    setLoading(true);
    setDownloadNotice(null);

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const blob = await res.blob();

      // Attempt 1: Modern Native File System Save Picker
      if ('showSaveFilePicker' in window) {
        try {
          const extension = suggestedFilename.endsWith('.html') ? '.html' : '.zip';
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: suggestedFilename,
            types: [{
              description: extension === '.html' ? 'Página Web Autónoma' : 'Archivo Comprimido ZIP',
              accept: { [mimeType]: [extension] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          setDownloadNotice(`¡Archivo guardado con éxito como ${suggestedFilename}!`);
          setLoading(false);
          return;
        } catch (pickerErr: any) {
          if (pickerErr.name === 'AbortError') {
            setLoading(false);
            return;
          }
          console.warn('File picker restricted by sandbox, falling back to Blob link:', pickerErr);
        }
      }

      // Attempt 2: Blob URL link
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.setAttribute('download', suggestedFilename);
      tempLink.setAttribute('target', '_blank');
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 5000);

      setDownloadNotice(`Iniciando descarga de ${suggestedFilename}. Si tu navegador la bloquea, usa el botón "Enlace directo".`);
    } catch (err) {
      console.error('Error downloading file:', err);
      window.open(endpoint, '_blank');
      setDownloadNotice(`Abriendo ${suggestedFilename} en una nueva pestaña para descargar directamente.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (url: string, type: 'web' | 'pc') => {
    navigator.clipboard.writeText(url).then(() => {
      if (type === 'web') {
        setCopiedWebLink(true);
        setTimeout(() => setCopiedWebLink(false), 2500);
      } else {
        setCopiedPcLink(true);
        setTimeout(() => setCopiedPcLink(false), 2500);
      }
    });
  };

  const handleCopyRawHtml = async () => {
    setIsCopyingCode(true);
    try {
      const res = await fetch('/api/download/web/raw');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedHtmlCode(true);
      setDownloadNotice('¡Código HTML completo copiado al portapapeles! Puedes pegarlo en un archivo "InverTrack.html"');
      setTimeout(() => setCopiedHtmlCode(false), 3000);
    } catch (e) {
      console.error('Failed to copy raw HTML:', e);
    } finally {
      setIsCopyingCode(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E2DEE5] dark:border-[#22121C] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF17C1]/10 text-[#FF17C1] flex items-center justify-center shadow-md">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F2F0F3]">Descargar InverTrack AI</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF17C1]/10 text-[#FF17C1] border border-[#FF17C1]/20">
                  Listo para Usar
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Descarga tu cartera para usarla en cualquier computadora sin depender de internet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice alert banner if present */}
        {downloadNotice && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">{downloadNotice}</div>
            <button onClick={() => setDownloadNotice(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Card 1: Versión Web HTML */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-[#F2F0F3]">1. Versión Web Autónoma (.HTML)</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#15141A] text-slate-700 dark:text-slate-300 font-mono">
                      InverTrack_Web.html
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Un único archivo HTML que contiene el 100% de la aplicación (React + Tailwind + Gráficos).
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-white dark:bg-[#15141A] p-3.5 rounded-2xl border border-slate-200 dark:border-[#281422]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span><strong>Abre con doble clic:</strong> Funciona en Chrome, Edge, Safari, Firefox y Brave.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span><strong>Sin instalación ni servidor:</strong> Puedes llevarlo en un pendrive y usarlo sin conexión.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span><strong>Datos guardados localmente:</strong> Tus carteras y boletos se guardan en tu navegador.</span>
              </div>
            </div>

            {/* Actions for Web HTML */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-[#22121C]">
              <span className="text-[11px] text-slate-500 font-mono">754 KB · HTML único</span>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Main Download Button */}
                <button
                  onClick={() => triggerDownload('/api/download/web', 'InverTrack_Web.html', 'text/html', setDownloadingWeb)}
                  disabled={downloadingWeb}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF17C1] to-[#D9048E] hover:from-[#E00EB1] hover:to-[#C0037D] text-white font-bold text-xs shadow-md shadow-[#FF17C1]/25 hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Descargar archivo en tu computadora"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{downloadingWeb ? 'Guardando...' : 'Descargar (.HTML)'}</span>
                </button>

                {/* Direct link in new tab */}
                <a
                  href={webDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="InverTrack_Web.html"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-[#281422] transition-colors flex items-center gap-1.5"
                  title="Abrir enlace de descarga directa en pestaña nueva fuera del marco"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enlace directo</span>
                </a>

                {/* Copy link */}
                <button
                  onClick={() => handleCopyLink(webDownloadUrl, 'web')}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#281422] transition-colors cursor-pointer"
                  title="Copiar URL directa de descarga"
                >
                  {copiedWebLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* Copy raw HTML code */}
                <button
                  onClick={handleCopyRawHtml}
                  disabled={isCopyingCode}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-600 dark:text-slate-400 text-[11px] border border-slate-200 dark:border-[#281422] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copiar el código HTML completo al portapapeles"
                >
                  <FileText className="w-3 h-3" />
                  <span>{copiedHtmlCode ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: App de Escritorio para PC (.ZIP) */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-[#F2F0F3]">2. App de Escritorio para PC (.ZIP)</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#15141A] text-slate-700 dark:text-slate-300 font-mono">
                      InverTrack-PC-App.zip
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Paquete portable para Windows con lanzador en ventana propia sin barras de navegador.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 bg-white dark:bg-[#15141A] p-3.5 rounded-2xl border border-slate-200 dark:border-[#281422]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span><strong>Ventana de escritorio nativa:</strong> Se abre en su propia ventana sin barras ni pestañas.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span><strong>Ejecutables incluidos:</strong> Haz doble clic en <code>InverTrack-App.bat</code> o <code>InverTrack.html</code>.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span><strong>Multi-plataforma:</strong> Incluye script <code>InverTrack-Mac-Linux.sh</code> para Mac y Linux.</span>
              </div>
            </div>

            {/* Actions for PC ZIP */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-[#22121C]">
              <span className="text-[11px] text-slate-500 font-mono">188 KB · Windows / Mac / Linux</span>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Main Download Button */}
                <button
                  onClick={() => triggerDownload('/api/download/pc', 'InverTrack-PC-App.zip', 'application/zip', setDownloadingPc)}
                  disabled={downloadingPc}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF17C1] to-[#D9048E] hover:from-[#E00EB1] hover:to-[#C0037D] text-white font-bold text-xs shadow-md shadow-[#FF17C1]/25 hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Descargar paquete ZIP en tu PC"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{downloadingPc ? 'Guardando...' : 'Descargar App (.ZIP)'}</span>
                </button>

                {/* Direct link in new tab */}
                <a
                  href={pcDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="InverTrack-PC-App.zip"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-[#281422] transition-colors flex items-center gap-1.5"
                  title="Abrir enlace de descarga directa en pestaña nueva fuera del marco"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enlace directo</span>
                </a>

                {/* Copy link */}
                <button
                  onClick={() => handleCopyLink(pcDownloadUrl, 'pc')}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#281422] transition-colors cursor-pointer"
                  title="Copiar URL directa de descarga"
                >
                  {copiedPcLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Explanation if download fails in iframe */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
            <Monitor className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-800 dark:text-[#F2F0F3]">
                ¿Por qué puede fallar la descarga dentro del visor?
              </p>
              <p className="text-[11px] leading-relaxed">
                El entorno de prueba de AI Studio ejecuta la app dentro de un marco seguro (<code>iframe</code>) que puede impedir que el navegador guarde archivos directamente al hacer clic. Para resolverlo:
              </p>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                <li>Haz clic en el botón <strong>"Enlace directo"</strong> junto a cada archivo (se abrirá en una pestaña propia fuera del visor y se descargará al instante).</li>
                <li>O usa el botón <strong>Copiar</strong> (<Copy className="w-3 h-3 inline text-slate-400" />) y pega el enlace en la barra de tu navegador.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2DEE5] dark:border-[#22121C] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Tus datos son 100% privados y se almacenan de forma local en tu computadora.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
