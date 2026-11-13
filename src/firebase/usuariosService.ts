/**
 * Servicio de Usuarios en Cloud Firestore (src/firebase/usuariosService.ts)
 *
 * Maneja el hash seguro de códigos TNE con Web Crypto API (SHA-256 + salt),
 * consultas de usuario, carga de datos de prueba (seed) y descuento atómico de saldo.
 */
import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import { db } from './config.ts';
import { cleanRut } from '../auth/utils/rut.ts';

export interface UsuarioFirestore {
  id: string;
  rut: string;
  nombre: string;
  codigo_tne_hash: string;
  saldo: number;
}

const COLECCION_USUARIOS = 'usuarios';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hashea un código de tarjeta TNE usando la API nativa crypto.subtle.digest('SHA-256', ...)
 * con un salt aleatorio de 16 bytes.
 * Devuelve el formato "saltHex:hashHex".
 */
export async function hashTneWeb(codigo: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(saltBytes);
  const data = new TextEncoder().encode(`${saltHex}:${codigo}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = bytesToHex(new Uint8Array(hashBuffer));
  return `${saltHex}:${hashHex}`;
}

/**
 * Verifica un código TNE ingresado contra el hash almacenado ("saltHex:hashHex")
 * usando SHA-256 con comparación en tiempo constante.
 */
export async function verifyTneWeb(
  codigo: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;

  const [saltHex, expectedHashHex] = parts;
  if (!saltHex || !expectedHashHex) return false;

  const data = new TextEncoder().encode(`${saltHex}:${codigo}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const actualHashHex = bytesToHex(new Uint8Array(hashBuffer));

  if (actualHashHex.length !== expectedHashHex.length) return false;

  let diff = 0;
  for (let i = 0; i < actualHashHex.length; i++) {
    diff |= actualHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Consulta el documento usuarios/{rutLimpio} en Cloud Firestore.
 * Devuelve los datos del usuario o null si no existe.
 */
export async function getUsuarioByRutFirestore(
  rut: string
): Promise<UsuarioFirestore | null> {
  const rutLimpio = cleanRut(rut);
  if (!rutLimpio) return null;

  const docRef = doc(db, COLECCION_USUARIOS, rutLimpio);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    rut: String(data.rut ?? docSnap.id),
    nombre: String(data.nombre ?? ''),
    codigo_tne_hash: String(data.codigo_tne_hash ?? ''),
    saldo: Number(data.saldo ?? 0),
  };
}

/**
 * Descuenta el saldo del usuario de forma segura y atómica usando runTransaction.
 * Impide dejar el saldo en números negativos.
 */
export async function descontarSaldoFirestore(
  rut: string,
  monto: number
): Promise<{ nuevoSaldo: number }> {
  const rutLimpio = cleanRut(rut);
  if (!rutLimpio) {
    throw new Error('RUT inválido para realizar el cobro.');
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error('El monto a descontar debe ser mayor a 0.');
  }

  const docRef = doc(db, COLECCION_USUARIOS, rutLimpio);

  const nuevoSaldo = await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(docRef);
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado en la base de datos.');
    }

    const saldoActual = Number(userDoc.data().saldo ?? 0);
    if (saldoActual < monto) {
      throw new Error('Saldo insuficiente para pagar el pasaje.');
    }

    const saldoResultante = saldoActual - monto;
    transaction.update(docRef, { saldo: saldoResultante });
    return saldoResultante;
  });

  return { nuevoSaldo };
}

interface SeedUsuario {
  nombre: string;
  rut: string;
  codigoTne: string;
  saldo: number;
}

const USUARIOS_PRUEBA: SeedUsuario[] = [
  {
    nombre: 'Usuario Prueba Uno',
    rut: '11111111-1',
    codigoTne: '10000001',
    saldo: 5000,
  },
  {
    nombre: 'Usuario Prueba Dos',
    rut: '22222222-2',
    codigoTne: '10000002',
    saldo: 1000,
  },
  {
    nombre: 'Usuario Prueba Tres',
    rut: '33333333-3',
    codigoTne: '10000003',
    saldo: 0,
  },
  {
    nombre: 'Usuario Prueba Cuatro',
    rut: '12345678-5',
    codigoTne: '10000004',
    saldo: 2500,
  },
];

/**
 * Carga o reinicia en la colección 'usuarios' de Firestore los 4 usuarios de prueba
 * con sus códigos TNE hasheados mediante hashTneWeb.
 */
export async function seedUsuariosFirestore(): Promise<void> {
  await Promise.all(
    USUARIOS_PRUEBA.map(async (u) => {
      const rutLimpio = cleanRut(u.rut);
      const codigoTneHash = await hashTneWeb(u.codigoTne);

      await setDoc(doc(db, COLECCION_USUARIOS, rutLimpio), {
        id: rutLimpio,
        rut: rutLimpio,
        nombre: u.nombre,
        codigo_tne_hash: codigoTneHash,
        saldo: u.saldo,
      });
    })
  );
}
