/**
 * Módulo de Autenticación y Sesión Compartida con Firebase Firestore (src/auth/AuthContext.tsx)
 *
 * Este contexto mantiene la sesión del usuario en localStorage y escucha en tiempo real
 * los cambios del documento en Firestore mediante `onSnapshot` (ideal para ver el saldo actualizado al instante).
 * Tus compañeros pueden usar `useAuth()` en cualquier pantalla de src/menu/ o src/nfc/.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import {
  getUsuarioByRutFirestore,
  verifyTneWeb,
  descontarSaldoFirestore,
} from '../firebase/usuariosService.ts';
import { cleanRut } from './utils/rut.ts';

const SESSION_STORAGE_KEY = 'red_movilidad_session_rut';

/**
 * Datos del usuario disponibles para toda la aplicación.
 */
export interface User {
  id: string;
  rut: string;
  nombre: string;
  saldo: number;
}

export interface AuthContextType {
  /**
   * Usuario actualmente autenticado con datos en tiempo real desde Firestore, o `null` si no hay sesión.
   * Contiene { id, rut, nombre, saldo }.
   */
  user: User | null;

  /**
   * `true` mientras se recupera la sesión guardada en localStorage y se conecta a Firestore.
   */
  loading: boolean;

  /**
   * Valida el RUT y el Código TNE contra Firestore y guarda la sesión en localStorage.
   * Devuelve { success: true } si es correcto, o { success: false, error: string } si falla.
   */
  login: (rut: string, codigoTne: string) => Promise<{ success: boolean; error?: string }>;

  /**
   * Cierra la sesión actual, detiene la suscripción en tiempo real y limpia localStorage.
   */
  logout: () => Promise<void>;

  /**
   * Descuenta el valor del pasaje en Firestore usando una transacción atómica (para el módulo NFC).
   * Devuelve { success: true, nuevoSaldo } o { success: false, error }.
   */
  pagarPasaje: (
    monto: number
  ) => Promise<{ success: boolean; nuevoSaldo?: number; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRut, setActiveRut] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(SESSION_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  // Suscripción en tiempo real con onSnapshot al documento del usuario en Firestore
  useEffect(() => {
    if (!activeRut) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'usuarios', activeRut);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUser({
            id: docSnap.id,
            rut: String(data.rut ?? docSnap.id),
            nombre: String(data.nombre ?? ''),
            saldo: Number(data.saldo ?? 0),
          });
        } else {
          // Si el documento ya no existe en Firestore, limpiar sesión local
          try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          } catch {
            // ignorar error de almacenamiento
          }
          setActiveRut(null);
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error al escuchar sesión en Firestore:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeRut]);

  /**
   * Inicia sesión verificando el RUT y el hash del código TNE en Firestore.
   * Devuelve { success: true } si es válido, o { success: false, error } si falla.
   */
  const login = async (
    rut: string,
    codigoTne: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const rutLimpio = cleanRut(rut);
      const codigoClean = codigoTne.trim();

      if (!rutLimpio || codigoClean.length < 4) {
        return { success: false, error: 'RUT o código incorrecto' };
      }

      const usuario = await getUsuarioByRutFirestore(rutLimpio);
      if (!usuario) {
        return { success: false, error: 'RUT o código incorrecto' };
      }

      const isMatch = await verifyTneWeb(codigoClean, usuario.codigo_tne_hash);
      if (!isMatch) {
        return { success: false, error: 'RUT o código incorrecto' };
      }

      try {
        localStorage.setItem(SESSION_STORAGE_KEY, usuario.rut);
      } catch {
        // continuar incluso si localStorage estuviera restringido
      }

      setUser({
        id: usuario.id,
        rut: usuario.rut,
        nombre: usuario.nombre,
        saldo: usuario.saldo,
      });
      setActiveRut(usuario.rut);

      return { success: true };
    } catch (error) {
      console.error('Error en login con Firestore:', error);
      return {
        success: false,
        error: 'No se pudo conectar con Firebase Firestore. Verifica las reglas o conexión.',
      };
    }
  };

  /**
   * Cierra la sesión actual eliminando el RUT guardado en localStorage y limpiando el estado.
   */
  const logout = async (): Promise<void> => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignorar
    }
    setActiveRut(null);
    setUser(null);
  };

  /**
   * Descuenta un monto del saldo del usuario autenticado usando una transacción en Firestore.
   * Devuelve { success: true, nuevoSaldo } o { success: false, error }.
   */
  const pagarPasaje = async (
    monto: number
  ): Promise<{ success: boolean; nuevoSaldo?: number; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No hay sesión activa para realizar el pago.' };
    }

    try {
      const { nuevoSaldo } = await descontarSaldoFirestore(user.rut, monto);
      return { success: true, nuevoSaldo };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo procesar el pago del pasaje.';
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, pagarPasaje }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para consumir la sesión y pagos en cualquier componente del proyecto.
 * Ejemplo de uso en el módulo de tus compañeros:
 * const { user, logout, pagarPasaje } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
