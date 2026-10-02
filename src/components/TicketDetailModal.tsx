import React from 'react';
import { X, Receipt, Building, Calendar, DollarSign, Tag, FileText, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Transaction } from '../types/portfolio';
import { formatMoney } from '../utils/calculations';

interface TicketDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const isBuy = transaction.operationType === 'BUY';
  const isSell = transaction.operationType === 'SELL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2DEE5] dark:border-[#22121C] bg-slate-50/50 dark:bg-[#08070A]/60">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isBuy ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : isSell ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}>
              {isBuy ? <ArrowUpRight className="w-5 h-5" /> : isSell ? <ArrowDownRight className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-[#F2F0F3] text-base">{transaction.ticker}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#15141A] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#281422]">
                  {transaction.operationType === 'BUY' ? 'COMPRA' : transaction.operationType === 'SELL' ? 'VENTA' : 'DIVIDENDO'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.assetName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Details Body */}
        <div className="p-5 space-y-4 text-xs">
          
          <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-[#08070A] p-4 rounded-2xl border border-slate-200 dark:border-[#281422]">
            <div>
              <span className="text-slate-400 text-[11px] block">Nº de Boleto / Orden:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-[#F2F0F3]">
                {transaction.ticketNumber || 'S/N'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Broker / ALyC:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {transaction.broker}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Fecha de Operación:</span>
              <span className="font-mono text-slate-800 dark:text-[#F2F0F3]">
                {transaction.date}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Categoría:</span>
              <span className="text-slate-800 dark:text-[#F2F0F3] font-medium">
                {transaction.assetCategory}
              </span>
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 dark:bg-[#08070A] p-4 rounded-2xl border border-slate-200 dark:border-[#281422] font-mono">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 font-sans">Cantidad / Nominales:</span>
              <span className="font-bold text-slate-900 dark:text-white">{transaction.quantity}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 font-sans">Precio Unitario:</span>
              <span>{formatMoney(transaction.price, transaction.currency)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 font-sans">Comisiones e Impuestos:</span>
              <span>{formatMoney(transaction.fees, transaction.currency)}</span>
            </div>

            <div className="border-t border-slate-200 dark:border-[#281422] pt-2 flex items-center justify-between text-sm font-bold">
              <span className="text-slate-900 dark:text-white font-sans">Monto Neto Liquidado:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(transaction.totalAmount, transaction.currency)}</span>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="p-3 bg-slate-50 dark:bg-[#08070A] rounded-2xl border border-slate-200 dark:border-[#281422]">
              <span className="text-slate-400 text-[11px] font-semibold block mb-0.5">Notas / Anotaciones:</span>
              <p className="text-slate-600 dark:text-slate-300 text-xs italic">{transaction.notes}</p>
            </div>
          )}

          {/* Source badge */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Archivo: {transaction.fileName || 'Carga directa / texto'}</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Boleto verificado
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2DEE5] dark:border-[#22121C] bg-slate-50/50 dark:bg-[#08070A]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
