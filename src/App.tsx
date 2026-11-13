/**
 * Componente Raíz de la Aplicación (src/App.tsx)
 *
 * Administra el enrutamiento según el estado de la sesión:
 * - Si `loading`: muestra un indicador de carga mientras valida la cookie de sesión.
 * - Si `user`: renderiza <HomeScreen /> (menú y vista del usuario autenticado).
 * - Si no hay sesión: renderiza <LoginScreen /> (pantalla de login).
 */

import React from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext.tsx';
import { LoginScreen } from './auth/LoginScreen.tsx';
import { HomeScreen } from './menu/HomeScreen.tsx';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-[#E30613] animate-spin" />
          <span className="text-xs font-medium text-slate-600">
            Verificando sesión...
          </span>
        </div>
      </div>
    );
  }

  return user ? <HomeScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
