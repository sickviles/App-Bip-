/**
 * Script de inicialización (Seed) de la base de datos de transporte.
 * Ejecutar con: npm run seed
 *
 * Reinicia la tabla 'usuarios' y carga los 4 usuarios de prueba académicos
 * con sus códigos TNE hasheados mediante crypto.scrypt.
 */
import { db, cleanRut, hashTne } from './db.ts';

interface SeedUser {
  nombre: string;
  rutFormateado: string;
  codigoTne: string;
  saldo: number;
}

const USUARIOS_SEMILLA: SeedUser[] = [
  {
    nombre: 'Usuario Prueba Uno',
    rutFormateado: '11111111-1',
    codigoTne: '10000001',
    saldo: 5000,
  },
  {
    nombre: 'Usuario Prueba Dos',
    rutFormateado: '22222222-2',
    codigoTne: '10000002',
    saldo: 1000,
  },
  {
    nombre: 'Usuario Prueba Tres',
    rutFormateado: '33333333-3',
    codigoTne: '10000003',
    saldo: 0,
  },
  {
    nombre: 'Usuario Prueba Cuatro',
    rutFormateado: '12345678-5',
    codigoTne: '10000004',
    saldo: 2500,
  },
];

async function seed() {
  console.log('🔄 Reiniciando tabla "usuarios"...');

  // Reiniciar la tabla
  db.exec(`
    DROP TABLE IF EXISTS usuarios;
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rut TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      codigo_tne_hash TEXT NOT NULL,
      saldo INTEGER DEFAULT 0
    );
  `);

  const insertStmt = db.prepare(`
    INSERT INTO usuarios (rut, nombre, codigo_tne_hash, saldo)
    VALUES (?, ?, ?, ?)
  `);

  console.log('🌱 Insertando usuarios de prueba...');

  for (const u of USUARIOS_SEMILLA) {
    const rutLimpio = cleanRut(u.rutFormateado);
    const hash = await hashTne(u.codigoTne);
    insertStmt.run(rutLimpio, u.nombre, hash, u.saldo);
    console.log(`  ✓ ${u.nombre} (RUT: ${u.rutFormateado} | TNE: ${u.codigoTne} | Saldo: $${u.saldo})`);
  }

  console.log('✅ Base de datos inicializada exitosamente.\n');
  console.log('Tabla de credenciales de prueba para el equipo:');
  console.log('-------------------------------------------------------------');
  console.log('| Nombre               | RUT         | Código TNE | Saldo   |');
  console.log('-------------------------------------------------------------');
  for (const u of USUARIOS_SEMILLA) {
    console.log(`| ${u.nombre.padEnd(20)} | ${u.rutFormateado.padEnd(11)} | ${u.codigoTne.padEnd(10)} | $${u.saldo.toString().padEnd(6)} |`);
  }
  console.log('-------------------------------------------------------------');
}

seed().catch((err) => {
  console.error('❌ Error al ejecutar seed:', err);
  process.exit(1);
});
