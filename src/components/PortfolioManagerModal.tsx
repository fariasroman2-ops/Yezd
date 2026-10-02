import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Wallet, FolderPlus, Sparkles } from 'lucide-react';
import { Portfolio } from '../types/portfolio';

interface PortfolioManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolios: Portfolio[];
  activePortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onCreatePortfolio: (name: string, description: string, color: string) => void;
  onUpdatePortfolio: (id: string, name: string, description: string, color: string) => void;
  onDeletePortfolio: (id: string) => void;
}

export const PortfolioManagerModal: React.FC<PortfolioManagerModalProps> = ({
  isOpen,
  onClose,
  portfolios,
  activePortfolioId,
  onSelectPortfolio,
  onCreatePortfolio,
  onUpdatePortfolio,
  onDeletePortfolio,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('cyan');

  const colorOptions = [
    { id: 'cyan', label: 'Cian Buenbit', class: 'bg-cyan-500' },
    { id: 'emerald', label: 'Verde Esmeralda', class: 'bg-emerald-500' },
    { id: 'indigo', label: 'Azul Índigo', class: 'bg-indigo-500' },
    { id: 'amber', label: 'Ámbar Dorado', class: 'bg-amber-500' },
    { id: 'rose', label: 'Rosa Rubí', class: 'bg-rose-500' },
    { id: 'purple', label: 'Púrpura', class: 'bg-purple-500' },
  ];

  const handleStartCreate = () => {
    setName('');
    setDescription('');
    setColor('cyan');
    setIsCreating(true);
    setEditingId(null);
  };

  const handleStartEdit = (p: Portfolio) => {
    setName(p.name);
    setDescription(p.description || '');
    setColor(p.color || 'cyan');
    setEditingId(p.id);
    setIsCreating(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      onUpdatePortfolio(editingId, name.trim(), description.trim(), color);
      setEditingId(null);
    } else {
      onCreatePortfolio(name.trim(), description.trim(), color);
      setIsCreating(false);
    }

    setName('');
    setDescription('');
  };

  const colorClasses: Record<string, string> = {
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2DEE5] dark:border-[#22121C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF17C1]/10 text-[#FF17C1] flex items-center justify-center">
              <Wallet className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F2F0F3]">Gestionar Mis Carteras</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Crea múltiples carteras con nombres personalizados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Create or Edit Form */}
          {(isCreating || editingId) ? (
            <form onSubmit={handleSave} className="p-4 bg-slate-50 dark:bg-[#08070A] rounded-2xl border border-slate-200 dark:border-[#281422] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-[#F2F0F3]">
                  {isCreating ? 'Nueva Cartera de Inversión' : 'Editar Cartera'}
                </span>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingId(null); }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Nombre de la Cartera</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Cartera Retiro, Cartera Trading, Cripto..."
                  className="w-full bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-[#F2F0F3] font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Descripción u Objetivo (Opcional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Inversión a largo plazo..."
                  className="w-full bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-[#F2F0F3] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Color distintivo</label>
                <div className="flex items-center gap-2">
                  {colorOptions.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`w-6 h-6 rounded-full ${c.class} transition-all cursor-pointer ${
                        color === c.id ? 'ring-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-50 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-[#FF17C1] to-[#D9048E] hover:from-[#E00EB1] hover:to-[#C0037D] text-white text-xs font-bold transition-all shadow-md shadow-[#FF17C1]/25 cursor-pointer"
                >
                  {isCreating ? 'Crear Cartera' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          ) : (
            /* Button to add new portfolio */
            <button
              onClick={handleStartCreate}
              className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-[#281422] hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/50 dark:bg-[#08070A]/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nueva Cartera Personalizada</span>
            </button>
          )}

          {/* List of Portfolios */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tus Carteras Activas
            </span>

            {/* Todas las carteras option */}
            <div 
              onClick={() => {
                onSelectPortfolio('all');
                onClose();
              }}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                activePortfolioId === 'all'
                  ? 'border-[#FF17C1]/60 bg-[#FF17C1]/5 dark:bg-[#FF17C1]/10'
                  : 'border-slate-200 dark:border-[#22121C] hover:bg-slate-50 dark:hover:bg-[#15141A]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#FF17C1] to-[#D9048E] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-[#F2F0F3]">Todas las Carteras</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Consolidado general de todas tus posiciones</p>
                </div>
              </div>
              {activePortfolioId === 'all' && (
                <span className="text-[11px] font-bold text-[#FF17C1]">Activa</span>
              )}
            </div>

            {/* Individual portfolios */}
            {portfolios.map(p => {
              const isSelected = activePortfolioId === p.id;
              const dotClass = colorClasses[p.color || 'cyan'] || 'bg-blue-500';

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500/60 bg-blue-50/40 dark:bg-blue-950/25'
                      : 'border-slate-200 dark:border-[#22121C] hover:bg-slate-50 dark:hover:bg-[#15141A]'
                  }`}
                >
                  <div 
                    onClick={() => {
                      onSelectPortfolio(p.id);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 flex-1 cursor-pointer"
                  >
                    <div className={`w-3 h-3 rounded-full ${dotClass} shrink-0`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-[#F2F0F3]">{p.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono">
                            Activa
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{p.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Editar nombre"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {portfolios.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la cartera "${p.name}"? Los boletos pasarán a la cartera por defecto.`)) {
                            onDeletePortfolio(p.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Eliminar cartera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2DEE5] dark:border-[#22121C] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
