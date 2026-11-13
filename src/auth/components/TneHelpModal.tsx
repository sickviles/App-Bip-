import React from 'react';
import { X, CreditCard, Info } from 'lucide-react';

interface TneHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TneHelpModal: React.FC<TneHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tne-help-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#E30613] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 id="tne-help-title" className="text-sm font-bold text-slate-900">
                ¿Dónde está el código de mi TNE?
              </h3>
              <p className="text-xs text-slate-500">Tarjeta Nacional Estudiantil</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Cerrar ayuda"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            El código corresponde al número único de identificación de tu pase escolar emitido por JUNAEB. Lo puedes encontrar impreso en tu tarjeta física:
          </p>

          {/* Realistic TNE Illustration */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 shadow-inner">
            <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-[#E30613]">TNE</span>
                  <span className="text-[10px] text-slate-500 font-medium">JUNAEB</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-1.5 bg-[#0033A0] rounded-xs inline-block" />
                  <span className="w-2.5 h-1.5 bg-[#E30613] rounded-xs inline-block" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1 items-center">
                <div className="col-span-1 h-14 bg-slate-200 rounded-md flex items-center justify-center text-[9px] text-slate-400">
                  Foto
                </div>
                <div className="col-span-3 space-y-1">
                  <div className="h-2 w-3/4 bg-slate-200 rounded-xs" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded-xs" />
                  
                  {/* Highlighted TNE Code */}
                  <div className="mt-2 p-1.5 bg-red-50 border border-red-300 rounded-md flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-[#E30613]">N° TARJETA:</span>
                    <span className="text-[11px] font-mono font-bold text-[#E30613] tracking-wider">
                      10000001
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                <span>Válida para Red Metropolitana de Movilidad</span>
                <span className="font-mono text-[8px]">CHILE</span>
              </div>
            </div>

            {/* Pointer note */}
            <div className="mt-3 flex items-start gap-2 bg-white/90 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700">
              <Info className="w-4 h-4 text-[#E30613] shrink-0 mt-0.5" />
              <span>
                Ingresa los <strong>8 dígitos</strong> numéricos situados en la parte frontal o posterior de tu tarjeta.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#E30613] hover:bg-[#C40510] rounded-lg transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
