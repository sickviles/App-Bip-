/**
 * Base de datos SQLite usando el módulo integrado 'node:sqlite' de Node 22.
 * No requiere paquetes externos ni drivers adicionales.
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import crypto from 'node:crypto';

// Ruta del archivo SQLite en la raíz del proyecto
const DB_PATH = path.resolve(process.cwd(), 'transporte.db');

export const db = new DatabaseSync(DB_PATH);

// Inicializar la tabla de usuarios según las especificaciones del proyecto
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rut TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    codigo_tne_hash TEXT NOT NULL,
    saldo INTEGER DEFAULT 0
  );
`);

export interface Usuario {
  id: number;
  rut: string;
  nombre: string;
  codigo_tne_hash: string;
  saldo: number;
}

/**
 * Limpia el RUT chileno eliminando puntos y guiones, dejando la K en mayúscula.
 * Ejemplo: "12.345.678-k" -> "12345678K"
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Hashea un código de tarjeta TNE usando crypto.scrypt con un salt criptográfico seguro de 16 bytes.
 * Devuelve el formato "salt:hashHex".
 */
export function hashTne(codigo: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(codigo, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Compara un código TNE ingresado contra el hash almacenado usando crypto.timingSafeEqual
 * para evitar ataques de temporización (timing attacks).
 */
export function verifyTne(codigo: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return resolve(false);

    crypto.scrypt(codigo, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      const keyBuffer = Buffer.from(key, 'hex');
      if (derivedKey.length !== keyBuffer.length) {
        return resolve(false);
      }
      try {
        const match = crypto.timingSafeEqual(derivedKey, keyBuffer);
        resolve(match);
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * Busca un usuario por su RUT limpio.
 */
export function getUsuarioByRut(rutLimpio: string): Usuario | undefined {
  const stmt = db.prepare('SELECT id, rut, nombre, codigo_tne_hash, saldo FROM usuarios WHERE rut = ?');
  const row = stmt.get(rutLimpio) as Usuario | undefined;
  return row;
}

/**
 * Busca un usuario por su ID numérico.
 */
export function getUsuarioById(id: number): Usuario | undefined {
  const stmt = db.prepare('SELECT id, rut, nombre, codigo_tne_hash, saldo FROM usuarios WHERE id = ?');
  const row = stmt.get(id) as Usuario | undefined;
  return row;
}

/**
 * Función de utilidad para actualizar el saldo (para el compañero que haga el NFC o recargas).
 */
export function updateSaldo(id: number, nuevoSaldo: number): void {
  const stmt = db.prepare('UPDATE usuarios SET saldo = ? WHERE id = ?');
  stmt.run(nuevoSaldo, id);
}
