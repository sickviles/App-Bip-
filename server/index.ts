/**
 * Servidor Express para el proyecto de transporte (Login, Sesiones y API).
 * Provee autenticación mediante cookies httpOnly y control de tasa (rate limit).
 */
import express from 'express';
import crypto from 'node:crypto';
import {
  cleanRut,
  getUsuarioByRut,
  getUsuarioById,
  verifyTne,
} from './db.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware para parsear cuerpos JSON
app.use(express.json());

// ============================================================================
// GESTIÓN DE SESIONES EN MEMORIA
// ============================================================================
interface SessionData {
  userId: number;
  createdAt: number;
}

const activeSessions = new Map<string, SessionData>();

/**
 * Extrae el session_id desde la cookie httpOnly o desde el encabezado Authorization
 */
function getSessionId(req: express.Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith('session_id=')) {
        return decodeURIComponent(c.substring('session_id='.length));
      }
    }
  }

  // Fallback opcional por encabezado Bearer
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

function setSessionCookie(res: express.Response, sessionId: string) {
  res.setHeader(
    'Set-Cookie',
    `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );
}

function clearSessionCookie(res: express.Response) {
  res.setHeader(
    'Set-Cookie',
    `session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

// ============================================================================
// CONTROL DE INTENTOS FALLIDOS (RATE LIMITING)
// 5 fallos seguidos desde la misma IP o RUT bloquean el acceso por 5 minutos
// ============================================================================
interface FailureRecord {
  failures: number;
  blockedUntil: number;
}

const failureMap = new Map<string, FailureRecord>();

function checkBlocked(key: string): { blocked: boolean; remainingSeconds: number } {
  const record = failureMap.get(key);
  if (!record || record.blockedUntil <= Date.now()) {
    return { blocked: false, remainingSeconds: 0 };
  }
  const remainingSeconds = Math.ceil((record.blockedUntil - Date.now()) / 1000);
  return { blocked: true, remainingSeconds };
}

function registerFailure(key: string) {
  const now = Date.now();
  const record = failureMap.get(key) || { failures: 0, blockedUntil: 0 };
  record.failures += 1;

  if (record.failures >= 5) {
    record.blockedUntil = now + 5 * 60 * 1000; // 5 minutos de bloqueo
  }

  failureMap.set(key, record);
}

function resetFailures(key: string) {
  failureMap.delete(key);
}

// ============================================================================
// RUTAS DE LA API DE AUTENTICACIÓN
// ============================================================================

/**
 * POST /api/login
 * Recibe { rut, codigoTne }.
 * Valida formato, verifica credenciales contra hash scrypt y abre sesión.
 */
app.post('/api/login', async (req, res) => {
  const { rut, codigoTne } = req.body || {};

  // Extraer IP para control de intentos
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const rutLimpio = cleanRut(String(rut || ''));
  const ipKey = `ip:${rawIp}`;
  const rutKey = `rut:${rutLimpio}`;

  // 1. Verificar si la IP o el RUT están bloqueados
  const ipStatus = checkBlocked(ipKey);
  const rutStatus = rutLimpio ? checkBlocked(rutKey) : { blocked: false, remainingSeconds: 0 };

  if (ipStatus.blocked || rutStatus.blocked) {
    const remainingSeconds = Math.max(ipStatus.remainingSeconds, rutStatus.remainingSeconds);
    const minutes = Math.ceil(remainingSeconds / 60);
    res.status(429).json({
      error: `Demasiados intentos fallidos. El acceso ha sido bloqueado temporalmente por 5 minutos (${minutes} min restantes).`,
    });
    return;
  }

  // 2. Validación de presencia y formato básico
  if (!rutLimpio || !codigoTne || String(codigoTne).trim().length < 4) {
    registerFailure(ipKey);
    if (rutLimpio) registerFailure(rutKey);
    res.status(401).json({ error: 'RUT o código incorrecto' });
    return;
  }

  // 3. Buscar usuario en la base de datos por RUT limpio
  const usuario = getUsuarioByRut(rutLimpio);
  if (!usuario) {
    registerFailure(ipKey);
    registerFailure(rutKey);
    res.status(401).json({ error: 'RUT o código incorrecto' });
    return;
  }

  // 4. Verificar código TNE contra el hash scrypt
  const codigoString = String(codigoTne).trim();
  const passwordMatch = await verifyTne(codigoString, usuario.codigo_tne_hash);

  if (!passwordMatch) {
    registerFailure(ipKey);
    registerFailure(rutKey);
    res.status(401).json({ error: 'RUT o código incorrecto' });
    return;
  }

  // 5. Credenciales válidas: resetear contadores de fallos
  resetFailures(ipKey);
  resetFailures(rutKey);

  // 6. Crear token de sesión criptográfico y almacenar en memoria
  const sessionId = crypto.randomBytes(32).toString('hex');
  activeSessions.set(sessionId, {
    userId: usuario.id,
    createdAt: Date.now(),
  });

  // 7. Enviar cookie httpOnly
  setSessionCookie(res, sessionId);

  // 8. Responder con datos públicos del usuario
  res.json({
    id: usuario.id,
    rut: usuario.rut,
    nombre: usuario.nombre,
    saldo: usuario.saldo,
  });
});

/**
 * GET /api/me
 * Devuelve el usuario actualmente autenticado mediante la cookie httpOnly.
 */
app.get('/api/me', (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const session = activeSessions.get(sessionId);
  if (!session) {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Sesión expirada o inválida' });
    return;
  }

  // Consultar el usuario fresco en la base de datos (para reflejar cambios de saldo)
  const usuario = getUsuarioById(session.userId);
  if (!usuario) {
    activeSessions.delete(sessionId);
    clearSessionCookie(res);
    res.status(401).json({ error: 'Usuario no encontrado' });
    return;
  }

  res.json({
    id: usuario.id,
    rut: usuario.rut,
    nombre: usuario.nombre,
    saldo: usuario.saldo,
  });
});

/**
 * POST /api/logout
 * Cierra la sesión activa y elimina la cookie httpOnly.
 */
app.post('/api/logout', (req, res) => {
  const sessionId = getSessionId(req);
  if (sessionId) {
    activeSessions.delete(sessionId);
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

// ============================================================================
// RUTA DE EJEMPLO PARA COMPAÑEROS DE EQUIPO (Módulo NFC / Menú)
// Si el compañero 2 o 3 necesita descontar saldo al pagar la micro, puede
// descomentar y usar esta ruta sin modificar /api/login:
// ============================================================================
/*
app.post('/api/saldo/descontar', (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const session = activeSessions.get(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Sesión inválida' });
  }

  const monto = Number(req.body?.monto);
  if (!monto || monto <= 0) {
    return res.status(400).json({ error: 'Monto inválido a descontar' });
  }

  const usuario = getUsuarioById(session.userId);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (usuario.saldo < monto) {
    return res.status(400).json({ error: 'Saldo insuficiente para pagar la micro' });
  }

  const nuevoSaldo = usuario.saldo - monto;
  updateSaldo(usuario.id, nuevoSaldo);

  return res.json({
    ok: true,
    montoDescontado: monto,
    nuevoSaldo,
  });
});
*/

// Iniciar servidor en el puerto configurado (3001 por defecto)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend Express escuchando en http://localhost:${PORT}`);
});
