/**
 * Utilidades para formateo y validación de RUN/RUT chileno.
 */

export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (!cleaned) return '';

  const dv = cleaned.slice(-1);
  const body = cleaned.slice(0, -1);

  if (!body) return dv;

  let formatted = '';
  let count = 0;

  for (let i = body.length - 1; i >= 0; i--) {
    formatted = body[i] + formatted;
    count++;
    if (count === 3 && i > 0) {
      formatted = '.' + formatted;
      count = 0;
    }
  }

  return `${formatted}-${dv}`;
}

export function validateRut(rut: string): { isValid: boolean; message: string } {
  const cleaned = cleanRut(rut);

  if (!cleaned) {
    return { isValid: false, message: 'Ingrese su RUT' };
  }

  if (cleaned.length < 8 || cleaned.length > 9) {
    return { isValid: false, message: 'El RUT debe tener entre 7 y 8 dígitos más dígito verificador' };
  }

  const dv = cleaned.slice(-1).toUpperCase();
  const body = cleaned.slice(0, -1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const calculatedDv = 11 - remainder;

  let expectedDv = '';
  if (calculatedDv === 11) {
    expectedDv = '0';
  } else if (calculatedDv === 10) {
    expectedDv = 'K';
  } else {
    expectedDv = calculatedDv.toString();
  }

  if (dv !== expectedDv) {
    return { isValid: false, message: 'Dígito verificador incorrecto' };
  }

  return { isValid: true, message: 'RUT válido' };
}
