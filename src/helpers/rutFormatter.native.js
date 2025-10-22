/**
 * Helper para formateo de RUT chileno - Versión React Native
 * Maneja el formato visual (12.345.678-9) y limpieza para API (12345678-9)
 */

/**
 * Limpia el RUT removiendo todos los caracteres no válidos
 * @param {string} run - RUT a limpiar
 * @returns {string} RUT limpio con solo números y K
 */
export const cleanRut = (run) => {
  if (!run) return '';
  return run.toString().replace(/[^\dkK]/g, '').toUpperCase();
};

/**
 * Formatea el RUT para visualización con puntos y guión (12.345.678-9)
 * @param {string} run - RUT a formatear
 * @returns {string} RUT formateado para mostrar
 */
export const formatRutForDisplay = (run) => {
  const clean = cleanRut(run);
  
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean;
  
  // Separar cuerpo y dígito verificador
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  // Validar que el cuerpo sean solo números
  if (!/^\d+$/.test(body)) {
    // Si no es válido, devolver solo lo que sea válido
    if (/^\d+$/.test(clean)) {
      // Solo números, aún no tiene DV
      return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return run;
  }
  
  // Remover ceros a la izquierda
  const cleanBody = body.replace(/^0+/, '') || '0';
  
  // Formatear con puntos cada 3 dígitos desde la derecha
  const formattedBody = cleanBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedBody}-${dv}`;
};

/**
 * Formatea el RUT para envío al API (sin puntos, solo guión: 12345678-9)
 * @param {string} run - RUT a formatear
 * @returns {string} RUT formateado para API
 */
export const formatRutForAPI = (run) => {
  const clean = cleanRut(run);
  
  if (clean.length < 2) return clean;
  
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  // Validar que el cuerpo sean solo números
  if (!/^\d+$/.test(body)) return '';
  
  // Remover ceros a la izquierda
  const cleanBody = body.replace(/^0+/, '') || '0';
  
  return `${cleanBody}-${dv}`;
};

/**
 * Valida si un RUT tiene el formato correcto
 * @param {string} run - RUT a validar
 * @returns {boolean} true si el formato es válido
 */
export const isValidRutFormat = (run) => {
  const apiFormat = formatRutForAPI(run);
  return /^\d{7,8}-[\dkK]$/.test(apiFormat);
};

/**
 * Calcula el dígito verificador de un RUT
 * @param {string} rutBody - Cuerpo del RUT (solo números)
 * @returns {string} Dígito verificador calculado
 */
export const calculateRutDV = (rutBody) => {
  if (!/^\d+$/.test(rutBody)) return '';
  
  let sum = 0;
  let multiplier = 2;
  
  // Calcular desde el último dígito hacia el primero
  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += parseInt(rutBody[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = 11 - remainder;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
};

/**
 * Valida si un RUT es matemáticamente correcto
 * @param {string} run - RUT a validar
 * @returns {boolean} true si el RUT es válido
 */
export const isValidRut = (run) => {
  const apiFormat = formatRutForAPI(run);
  
  if (!isValidRutFormat(apiFormat)) return false;
  
  const body = apiFormat.slice(0, -2); // Remover -DV
  const dv = apiFormat.slice(-1);
  
  const calculatedDV = calculateRutDV(body);
  
  return dv.toUpperCase() === calculatedDV.toUpperCase();
};

/**
 * Maneja el input de RUT en tiempo real para React Native
 * Formatea automáticamente mientras el usuario escribe
 * @param {string} value - Valor del input
 * @returns {string} Valor formateado
 */
export const handleRutInput = (value) => {
  return formatRutForDisplay(value);
};

/**
 * Obtiene un mensaje de error según el estado del RUT
 * @param {string} run - RUT a validar
 * @returns {string} Mensaje de error o string vacío si es válido
 */
export const getRutErrorMessage = (run) => {
  if (!run || run.trim() === '') {
    return 'El RUT es requerido';
  }
  
  if (!isValidRutFormat(run)) {
    return 'Formato de RUT inválido (ej: 12.345.678-9)';
  }
  
  if (!isValidRut(run)) {
    return 'El RUT ingresado no es válido';
  }
  
  return '';
};

// Exportar todas las funciones como default también
export default {
  cleanRut,
  formatRutForDisplay,
  formatRutForAPI,
  isValidRutFormat,
  calculateRutDV,
  isValidRut,
  handleRutInput,
  getRutErrorMessage,
};
