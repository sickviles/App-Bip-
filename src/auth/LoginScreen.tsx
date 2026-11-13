import React, { useState } from 'react';
import {
  CreditCard,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { formatRut, validateRut } from './utils/rut.ts';
import { RedLogo } from './components/RedLogo.tsx';
import { TneHelpModal } from './components/TneHelpModal.tsx';
import { useAuth } from './AuthContext.tsx';

interface FormErrors {
  rut?: string;
  codigoTne?: string;
}

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();

  const [rut, setRut] = useState('');
  const [codigoTne, setCodigoTne] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Formateo dinámico del RUT
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setRut(formatted);
    if (errors.rut) setErrors((prev) => ({ ...prev, rut: undefined }));
    if (serverError) setServerError(null);
  };

  // Código TNE solo numérico
  const handleTneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanNum = e.target.value.replace(/\D/g, '').slice(0, 9);
    setCodigoTne(cleanNum);
    if (errors.codigoTne) setErrors((prev) => ({ ...prev, codigoTne: undefined }));
    if (serverError) setServerError(null);
  };

  // Validación en tiempo real del RUT para feedback visual sutil
  const rutValidation = rut.length >= 8 ? validateRut(rut) : null;

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const newErrors: FormErrors = {};

    // 1. Validar RUT
    if (!rut.trim()) {
      newErrors.rut = 'Por favor, ingrese su RUT';
    } else {
      const check = validateRut(rut);
      if (!check.isValid) {
        newErrors.rut = check.message;
      }
    }

    // 2. Validar Código TNE
    const tneClean = codigoTne.trim();
    if (!tneClean) {
      newErrors.codigoTne = 'Por favor, ingrese el código de su tarjeta TNE';
    } else if (tneClean.length < 4 || tneClean.length > 9) {
      newErrors.codigoTne = 'El código TNE debe tener entre 4 y 9 dígitos';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    // Llamada real al backend mediante AuthContext
    const result = await login(rut, codigoTne);
    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.error || 'RUT o código incorrecto');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-[#E30613] selection:text-white">
      {/* Nota discreta superior: Proyecto académico */}
      <header className="w-full bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span className="font-semibold text-slate-700">Red Movilidad</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Pago con NFC</span>
        </div>
        <div className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
          Proyecto académico – datos de prueba
        </div>
      </header>

      {/* Tarjeta Central del Login */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden my-4 animate-fade-in">
          {/* Cabecera institucional en Rojo Red */}
          <div className="bg-[#E30613] text-white px-6 pt-7 pb-6 relative overflow-hidden">
            <div
              className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute right-12 -top-6 w-20 h-20 rounded-full bg-white/5 pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <RedLogo variant="white" size="md" />
                <span className="text-[10px] tracking-wider font-semibold uppercase bg-white/20 px-2 py-0.5 rounded-full text-white backdrop-blur-xs">
                  Inicio de Sesión
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Bienvenido a Red
              </h1>
              <p className="text-xs text-red-100 mt-1 leading-snug">
                Ingresa tu RUT y el código de tu pase escolar TNE para acceder al pago de transporte.
              </p>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-6 sm:p-8 bg-white">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* 1. Campo RUT */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="rut"
                    className="block text-xs font-bold text-slate-800"
                  >
                    RUT del Estudiante
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Formato: 12.345.678-9
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    id="rut"
                    name="rut"
                    type="text"
                    autoCapitalize="characters"
                    autoComplete="username"
                    maxLength={12}
                    value={rut}
                    onChange={handleRutChange}
                    placeholder="11.111.111-1"
                    className={`w-full pl-10 pr-9 py-2.5 text-sm font-mono tracking-wide bg-white rounded-xl border transition-colors outline-none text-slate-900 placeholder:text-slate-400 ${
                      errors.rut
                        ? 'border-red-500 ring-2 ring-red-100'
                        : rutValidation?.isValid
                        ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                        : 'border-slate-300 focus:border-[#E30613] focus:ring-2 focus:ring-red-100'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {rutValidation?.isValid && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </div>

                {errors.rut ? (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.rut}
                  </p>
                ) : rutValidation && !rutValidation.isValid ? (
                  <p className="mt-1 text-[11px] text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Dígito verificador incorrecto
                  </p>
                ) : null}
              </div>

              {/* 2. Campo Código de Tarjeta TNE */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="codigoTne"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Código de Tarjeta TNE
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(true)}
                    className="text-[11px] font-semibold text-[#E30613] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    ¿Dónde está?
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    id="codigoTne"
                    name="codigoTne"
                    type="text"
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={9}
                    value={codigoTne}
                    onChange={handleTneChange}
                    placeholder="8 dígitos (ej. 10000001)"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-wider bg-white rounded-xl border transition-colors outline-none text-slate-900 placeholder:text-slate-400 ${
                      errors.codigoTne
                        ? 'border-red-500 ring-2 ring-red-100'
                        : 'border-slate-300 focus:border-[#E30613] focus:ring-2 focus:ring-red-100'
                    }`}
                  />
                </div>

                {errors.codigoTne && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.codigoTne}
                  </p>
                )}
              </div>

              {/* Botón de Iniciar Sesión */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-[#E30613] hover:bg-[#C40510] active:bg-[#9F040D] rounded-xl shadow-md shadow-red-500/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verificando credenciales...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Mensaje de Error del Servidor (debajo del formulario) */}
              {serverError && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fade-in"
                >
                  <AlertCircle className="w-4 h-4 text-[#E30613] shrink-0 mt-0.5" />
                  <div className="font-medium leading-relaxed">
                    {serverError}
                  </div>
                </div>
              )}

              {/* Nota institucional de seguridad */}
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 border-t border-slate-100">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Acceso protegido · Sesión segura con cookie httpOnly</span>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Pie de página discreto */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-500">
        <span>Proyecto académico – datos de prueba</span>
      </footer>

      {/* Modal de ayuda sobre el código TNE */}
      <TneHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
