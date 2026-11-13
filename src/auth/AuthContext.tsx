/**
 * Módulo de Autenticación y Sesión Compartida (src/auth/AuthContext.tsx)
 *
 * Este contexto maneja la sesión del usuario a través de cookies httpOnly.
 * Tus compañeros de equipo pueden consumir `useAuth()` para saber quién está logueado,
 * ver su saldo actual o cerrar sesión.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Datos del usuario disponibles para toda la aplicación.
 */
export interface User {
  id: number;
  rut: string;
  nombre: string;
  saldo: number;
}

export interface AuthContextType {
  /**
   * Usuario actualmente autenticado, o `null` si no hay sesión abierta.
   * Contiene { id, rut, nombre, saldo }.
   */
  user: User | null;

  /**
   * `true` mientras el sistema verifica si existe una sesión activa previa (al cargar o recargar).
   */
  loading: boolean;

  /**
   * Inicia sesión enviando el RUT y el Código TNE al servidor.
   * Devuelve { success: true } si es correcto, o { success: false, error: string } si falla.
   */
  login: (rut: string, codigoTne: string) => Promise<{ success: boolean; error?: string }>;

  /**
   * Cierra la sesión activa en el servidor y limpia la cookie y el estado local.
   */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Al cargar la app, recupera la sesión activa desde el servidor (no se pierde al recargar F5)
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const res = await fetch('/api/me', {
          method: 'GET',
          credentials: 'include', // Envía la cookie httpOnly al servidor
        });

        if (res.ok) {
          const data = (await res.json()) as User;
          if (isMounted) setUser(data);
        } else {
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.warn('No se pudo verificar la sesión inicial:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Envía las credenciales al endpoint /api/login
   */
  const login = async (
    rut: string,
    codigoTne: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ rut, codigoTne }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data as User);
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'RUT o código incorrecto',
      };
    } catch {
      return {
        success: false,
        error: 'Error de conexión con el servidor. Revisa si el backend está activo.',
      };
    }
  };

  /**
   * Envía la petición de cierre de sesión al endpoint /api/logout
   */
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Error al llamar a /api/logout:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para consumir la sesión en cualquier componente del proyecto.
 * Ejemplo de uso en el módulo de tus compañeros:
 * const { user, logout } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
