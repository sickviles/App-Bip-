# 🚍 Red Movilidad – Aplicación de Pago de Transporte con NFC (Proyecto Académico)

Este es un proyecto académico desarrollado en equipo con **React, Vite, TypeScript, Tailwind CSS, Express y SQLite**.
Simula la aplicación oficial de **Red Movilidad** (Santiago de Chile) para que estudiantes autenticados mediante su **RUT** y **Pase Escolar TNE** puedan consultar su saldo y pagar la micro utilizando NFC.

> ⚠️ **Nota:** Este proyecto utiliza datos ficticios únicamente para fines educativos y de evaluación académica.

---

## 1. Requisitos Previos

- **Node.js 22 o superior:** Es obligatorio contar con Node 22+ debido a que la base de datos utiliza el módulo oficial e integrado `node:sqlite` (sin necesidad de instalar dependencias externas ni SQLite compilado).
- **npm** (incluido habitualmente con Node.js).
- Navegador web moderno (Chrome, Edge, Firefox, Safari).

---

## 2. Cómo Ejecutar el Proyecto Paso a Paso

Al clonar el repositorio desde GitHub por primera vez, sigue estos 3 comandos en tu terminal:

```bash
# Paso 1: Instalar las dependencias del proyecto
npm install

# Paso 2: Crear e inicializar la base de datos con los usuarios de prueba
npm run seed

# Paso 3: Levantar el servidor backend (Express) y frontend (Vite)
npm run dev
```

Una vez ejecutado `npm run dev`:
- Abre tu navegador en: **`http://localhost:3000`**
- El frontend se comunica con el servidor Express (puerto 3001) de manera automática mediante un proxy en `/api`.

---

## 3. Usuarios de Prueba (Base de Datos)

El archivo de base de datos (`transporte.db`) no se sube a GitHub por seguridad y buenas prácticas; cada integrante del equipo lo genera localmente ejecutando `npm run seed`.

Puedes iniciar sesión con cualquiera de estas credenciales ficticias:

| Nombre de Usuario | RUT (con guion) | Código Tarjeta TNE | Saldo Inicial |
| :--- | :--- | :--- | :--- |
| **Usuario Prueba Uno** | `11111111-1` | `10000001` | $5.000 |
| **Usuario Prueba Dos** | `22222222-2` | `10000002` | $1.000 |
| **Usuario Prueba Tres** | `33333333-3` | `10000003` | $0 |
| **Usuario Prueba Cuatro** | `12345678-5` | `10000004` | $2.500 |

*Nota sobre seguridad:* Los códigos TNE se almacenan con cifrado hash seguro mediante `crypto.scrypt` (con salt aleatorio de 16 bytes), por lo que nunca se guardan contraseñas en texto plano.

---

## 4. Cómo Usar la Sesión desde tu Módulo

Para el **Compañero 2 (Menú)** o el **Compañero 3 (NFC)**, no necesitan implementar autenticación ni llamar directamente a la base de datos para saber quién está navegando.

Basta con importar el hook `useAuth` desde `src/auth/AuthContext.tsx`:

```tsx
import React from 'react';
import { useAuth } from '../auth/AuthContext.tsx';

export function MiComponente() {
  // Obtenemos los datos de la sesión actual y la función para cerrar sesión
  const { user, logout } = useAuth();

  if (!user) {
    return <p>No hay sesión activa.</p>;
  }

  return (
    <div>
      <h3>Hola, {user.nombre}</h3>
      <p>ID de usuario: {user.id}</p>
      <p>RUT: {user.rut}</p>
      <p>Saldo disponible: ${user.saldo.toLocaleString('es-CL')}</p>

      {/* Botón para cerrar sesión */}
      <button onClick={logout}>
        Cerrar Sesión
      </button>
    </div>
  );
}
```

### Propiedades disponibles en `user`:
- `user.id`: Identificador numérico único del usuario en la base de datos (clave primaria).
- `user.nombre`: Nombre y apellido del estudiante (ej: "Usuario Prueba Uno").
- `user.rut`: RUN/RUT limpio del estudiante.
- `user.saldo`: Monto actual disponible en pesos chilenos para viajar en la micro.

---

## 5. Estructura de Carpetas y Responsabilidades

El proyecto está dividido modularmente para que cada miembro del equipo trabaje sin pisar el código de los demás:

```text
├── server/                    ← Backend con Node, Express y SQLite
│   ├── db.ts                  (Conexión SQLite con node:sqlite y funciones de usuario)
│   ├── index.ts               (Rutas /api/login, /api/me, /api/logout y control de intentos)
│   ├── seed.ts                (Script para inicializar la base de datos con npm run seed)
│   └── dev.ts                 (Script unificado para npm run dev)
│
├── src/
│   ├── auth/                  ← Responsabilidad: Compañero 1 (Login y Sesión)
│   │   ├── AuthContext.tsx    (Contexto global con useAuth, manejo de cookies y estado)
│   │   ├── LoginScreen.tsx    (Pantalla de login con campos RUT y código TNE)
│   │   ├── components/        (Logotipo Red Movilidad y modal informativo de TNE)
│   │   └── utils/             (Validador y formateador de RUT chileno)
│   │
│   ├── menu/                  ← Responsabilidad: Compañero 2
│   │   └── HomeScreen.tsx     (Pantalla de inicio, menú de opciones y saldo)
│   │
│   ├── nfc/                   ← Responsabilidad: Compañero 3
│   │   └── README.md          (Lógica de emulación o lectura de pago con NFC)
│   │
│   ├── App.tsx                (Enrutador principal: decide entre Login o Menú)
│   ├── main.tsx               (Punto de entrada de React)
│   └── index.css              (Estilos globales con Tailwind CSS)
│
├── .gitignore                 (Ignora node_modules, dist, *.db y archivos .env)
├── package.json               (Scripts y dependencias limpias)
├── tsconfig.json              (Configuración de TypeScript)
└── vite.config.ts             (Configuración de Vite con proxy /api -> puerto 3001)
```

---

## 6. Reglas de Trabajo del Equipo en GitHub

Para evitar conflictos y trabajar de forma colaborativa y ordenada:

1. **Trabaja únicamente en tu carpeta asignada:**
   - Compañero 1: `src/auth/`
   - Compañero 2: `src/menu/`
   - Compañero 3: `src/nfc/`
   - **No edites los archivos de tus compañeros sin previa coordinación.**

2. **Usa ramas (branches) por funcionalidad:**
   - Nunca hagas `push` directamente a la rama `main`.
   - Crea tu rama con un nombre claro, por ejemplo:
     - `git checkout -b feature/login`
     - `git checkout -b feature/menu`
     - `git checkout -b feature/nfc-pago`

3. **Pull Requests para integrar:**
   - Al terminar una tarea, sube tu rama y crea un **Pull Request (PR)** hacia `main`.
   - Al menos un compañero debe revisar y aprobar el PR antes de hacer el merge.

4. **Si necesitas una nueva ruta en el servidor:**
   - Por ejemplo, si el Compañero 3 necesita descontar saldo al aproximar el teléfono al validador NFC, debe agregar un endpoint propio en `server/index.ts` **sin modificar `/api/login` ni `/api/me`**.
   - En `server/index.ts` ya dejé una ruta de ejemplo comentada lista para usar:
     `POST /api/saldo/descontar { monto }`
