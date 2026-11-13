/**
 * Componente base para el Compañero 2 (src/menu/HomeScreen.tsx)
 *
 * Este componente es una plantilla mínima vacía.
 * Aquí el Compañero 2 construirá el menú y las pantallas de la aplicación.
 */

import React from 'react';
import { useAuth } from '../auth/AuthContext.tsx';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-slate-800">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        {/* Datos disponibles para el compañero 2 */}
        <h1 className="text-xl font-bold text-slate-900">
          Hola, {user.nombre}
        </h1>
        <p className="text-sm text-slate-600">
          Saldo disponible: <strong className="text-slate-900 font-mono">${user.saldo}</strong>
        </p>

        {/* Nota para el compañero */}
        <p className="text-xs text-slate-400 italic border-t border-b border-slate-100 py-3">
          (Espacio listo para que el Compañero 2 desarrolle el menú aquí)
        </p>

        {/* Botón para cerrar sesión */}
        <button
          type="button"
          onClick={logout}
          className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#E30613] hover:bg-[#C40510] rounded-xl transition-colors cursor-pointer"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
