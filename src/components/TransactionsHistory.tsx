import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  FileText, 
  Building, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  Plus,
  RefreshCw,
  FolderKanban,
  Building2,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Transaction, OperationType, CurrencySettings, Portfolio } from '../types/portfolio';
import { formatMoney } from '../utils/calculations';
import { BrokerPortfolioImporter } from './BrokerPortfolioImporter';

interface TransactionsHistoryProps {
  transactions: Transaction[];
  currencySettings: CurrencySettings;
  onDeleteTransaction: (id: string) => void;
  onOpenManualTrade: () => void;
  onViewTicketDetail: (tx: Transaction) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  initialFilterTicker?: string;
  onClearInitialFilterTicker?: () => void;
  initialFilterBroker?: string;
  onClearInitialFilterBroker?: () => void;
  portfolios?: Portfolio[];
  onAddMultipleTransactions?: (txs: Array<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  activePortfolioId?: string;
  onGoToPortfolio?: () => void;
}

export const TransactionsHistory: React.FC<TransactionsHistoryProps> = ({
  transactions,
  currencySettings,
  onDeleteTransaction,
  onOpenManualTrade,
  onViewTicketDetail,
  onExportCSV,
  onExportJSON,
  initialFilterTicker,
  onClearInitialFilterTicker,
  initialFilterBroker,
  onClearInitialFilterBroker,
  portfolios = [],
  onAddMultipleTransactions,
  activePortfolioId = 'default',
  onGoToPortfolio,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'import-broker'>('list');
  const [importedAlert, setImportedAlert] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialFilterTicker || '');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterBroker, setFilterBroker] = useState<string>(initialFilterBroker || 'ALL');

  // Unique brokers list
  const brokers = Array.from(new Set(transactions.map(t => t.broker).filter(Boolean)));

  const filtered = transactions
    .filter(t => {
      const matchSearch = 
        t.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.ticketNumber && t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchType = filterType === 'ALL' || t.operationType === filterType;
      const matchBroker = filterBroker === 'ALL' || t.broker === filterBroker;

      return matchSearch && matchType && matchBroker;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getPortfolioName = (pId?: string) => {
    if (!pId) return null;
    const p = portfolios.find(item => item.id === pId);
    return p ? p.name : null;
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation Tabs: Desglosado vs Cargar Cartera por Broker */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-2xl p-2 px-3 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#08070A] rounded-xl border border-slate-200 dark:border-[#281422] text-xs font-bold">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-[#FF17C1]" />
            <span>Órdenes Desglosadas ({transactions.length})</span>
          </button>

          <button
            onClick={() => setViewMode('import-broker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'import-broker'
                ? 'bg-gradient-to-r from-blue-600 to-[#FF17C1] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span>+ Cargar Cartera Entera por Broker</span>
          </button>
        </div>

        {viewMode === 'list' && (
          <button
            onClick={() => setViewMode('import-broker')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#FF17C1] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Cargar Cartera por Broker</span>
          </button>
        )}
      </div>

      {/* SUCCESS ALERT IF JUST IMPORTED */}
      {importedAlert && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-400 animate-fadeIn">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{importedAlert}</span>
          </div>
          <button onClick={() => setImportedAlert(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer px-1">
            ✕
          </button>
        </div>
      )}

      {/* VIEW MODE 1: BROKER PORTFOLIO IMPORTER DIRECTLY IN THE TAB */}
      {viewMode === 'import-broker' && (
        <div className="animate-fadeIn">
          <BrokerPortfolioImporter
            onAddMultipleTransactions={(txs) => {
              if (onAddMultipleTransactions) {
                onAddMultipleTransactions(txs);
              }
            }}
            onGoToPortfolio={onGoToPortfolio || (() => {})}
            portfolios={portfolios}
            activePortfolioId={activePortfolioId}
            onSuccess={(brokerName, count) => {
              setFilterBroker(brokerName);
              setViewMode('list');
              setImportedAlert(`¡Excelente! Se cargaron ${count} órdenes desglosadas con éxito para ${brokerName}. Todas las posiciones están computadas.`);
            }}
          />
        </div>
      )}

      {/* VIEW MODE 2: DESGLOSADO TRANSACTIONS TABLE */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl shadow-sm p-5 sm:p-6 space-y-5 transition-colors animate-fadeIn">
          
          {/* Header and Actions */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#FF17C1]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
                  Órdenes Bursátiles & Desglose Cronológico
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  ({filtered.length} {filtered.length === 1 ? 'orden' : 'órdenes'})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Desglose detallado de compras, ventas, dividendos y carteras cargadas por broker
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setViewMode('import-broker')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>+ Cargar Cartera por Broker</span>
              </button>

              <button
                onClick={onOpenManualTrade}
                className="px-3.5 py-2 rounded-xl bg-[#FF17C1] hover:bg-[#E00EB1] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#FF17C1]/25 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nueva Operación</span>
              </button>

              <button
                onClick={onExportCSV}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-[#F2F0F3] text-xs font-semibold border border-slate-200 dark:border-[#281422] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Exportar órdenes desglosadas a planilla Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ticker, boleto o notas..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl text-xs text-slate-800 dark:text-[#F2F0F3] placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Operation type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todas las Operaciones</option>
            <option value="BUY">Compras</option>
            <option value="SELL">Ventas</option>
            <option value="DIVIDEND">Dividendos / Rentas</option>
            <option value="DEPOSIT">Aportes</option>
            <option value="WITHDRAWAL">Retiros</option>
          </select>

          {/* Broker */}
          <select
            value={filterBroker}
            onChange={(e) => setFilterBroker(e.target.value)}
            className="bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Brokers</option>
            {brokers.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Active filters pill indicators */}
      {(initialFilterTicker || initialFilterBroker !== 'ALL') && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Filtro activo:</span>
          {initialFilterTicker && (
            <button
              onClick={onClearInitialFilterTicker}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Ticker: {initialFilterTicker} ✕
            </button>
          )}
          {initialFilterBroker && initialFilterBroker !== 'ALL' && (
            <button
              onClick={onClearInitialFilterBroker}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Broker: {initialFilterBroker} ✕
            </button>
          )}
        </div>
      )}

      {/* Transactions Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#22121C] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-[#08070A]/60">
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Activo</th>
                <th className="py-3 px-3 text-right">Cantidad</th>
                <th className="py-3 px-3 text-right">Precio Unit.</th>
                <th className="py-3 px-3 text-right">Comisión</th>
                <th className="py-3 px-3 text-right">Monto Total</th>
                <th className="py-3 px-3">Broker</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1C1018]">
              {filtered.map(tx => {
                const isBuy = tx.operationType === 'BUY';
                const isSell = tx.operationType === 'SELL';
                const isDiv = tx.operationType === 'DIVIDEND';
                const pName = getPortfolioName(tx.portfolioId);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    
                    {/* Date */}
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Operation Type */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        isBuy ? 'text-emerald-600 dark:text-emerald-400' :
                        isSell ? 'text-rose-600 dark:text-rose-400' :
                        isDiv ? 'text-amber-500 dark:text-amber-400' : 'text-purple-400'
                      }`}>
                        {isBuy && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isSell && <ArrowUpRight className="w-3.5 h-3.5" />}
                        <span>
                          {isBuy ? 'Compra' : isSell ? 'Venta' : isDiv ? 'Dividendo' : tx.operationType}
                        </span>
                      </span>
                    </td>

                    {/* Ticker & Name */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-900 dark:text-[#F2F0F3]">
                          {tx.ticker}
                        </span>
                        {pName && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{pName}]
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate" title={tx.assetName}>
                        {tx.assetName}
                      </p>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                      {tx.quantity < 1 ? tx.quantity.toFixed(4) : tx.quantity.toLocaleString('es-AR')}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {formatMoney(tx.price, tx.currency)}
                    </td>

                    {/* Commission */}
                    <td className="py-3 px-3 text-right font-mono text-slate-500 tabular-nums">
                      {(tx.fees || tx.commission) ? formatMoney(tx.fees || tx.commission || 0, tx.currency) : '-'}
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-[#F2F0F3] tabular-nums">
                      {formatMoney(tx.totalAmount, tx.currency)}
                    </td>

                    {/* Broker */}
                    <td className="py-3 px-3">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {tx.broker}
                      </span>
                      {tx.ticketNumber && (
                        <p className="text-[10px] text-slate-400 font-mono">#{tx.ticketNumber}</p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewTicketDetail(tx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Ver detalle de boleto y notas"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Eliminar este boleto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400">
          <p className="text-sm">No se encontraron operaciones registradas.</p>
        </div>
      )}

        </div>
      )}

    </div>
  );
};
