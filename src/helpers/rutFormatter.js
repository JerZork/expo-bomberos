/**
 * Helper para formateo de RUT chileno
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
  if (!/^\d+$/.test(body)) return run; // Retornar original si no es válido
  
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
 * Maneja el input de RUT en tiempo real
 * Formatea automáticamente mientras el usuario escribe
 * @param {Event} event - Evento del input
 * @param {Function} setValue - Función para actualizar el valor (react-hook-form)
 * @param {string} fieldName - Nombre del campo
 * @returns {string} Valor formateado
 */
export const handleRutInput = (event, setValue, fieldName = 'run') => {
  const inputValue = event.target.value;
  const cursorPosition = event.target.selectionStart;
  
  // Formatear para visualización
  const formatted = formatRutForDisplay(inputValue);
  
  // Actualizar el valor en el formulario
  if (setValue) {
    setValue(fieldName, formatted);
  }
  
  // Calcular nueva posición del cursor
  setTimeout(() => {
    const lengthDiff = formatted.length - inputValue.length;
    const newPosition = Math.max(0, cursorPosition + lengthDiff);
    
    if (event.target.setSelectionRange) {
      event.target.setSelectionRange(newPosition, newPosition);
    }
  }, 0);
  
  return formatted;
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

/**
 * Configuración para campo de RUT en formularios
 * @param {Function} setValue - Función setValue de react-hook-form
 * @param {string} fieldName - Nombre del campo (default: 'run')
 * @returns {Object} Configuración del campo
 */
export const getRutFieldConfig = (setValue, fieldName = 'run') => ({
  label: "RUT",
  name: fieldName,
  placeholder: "12.345.678-9",
  fieldType: 'input',
  type: "text",
  required: true,
  minLength: 11, // Mínimo con formato: 1.234.567-8
  maxLength: 12, // Máximo con formato: 12.345.678-9
  autoComplete: "off",
  validate: {
    validFormat: (value) => {
      if (!value) return true; // Si es requerido, se valida en 'required'
      return isValidRutFormat(value) || 'El RUT debe tener el formato 12.345.678-9';
    },
    validRut: (value) => {
      if (!value || !isValidRutFormat(value)) return true; // Ya se valida el formato arriba
      return isValidRut(value) || 'El RUT ingresado no es válido';
    }
  },
  onChange: (e) => handleRutInput(e, setValue, fieldName),
  onPaste: (e) => {
    // Manejar pegado de texto
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const formatted = formatRutForDisplay(pastedText);
    setValue(fieldName, formatted);
  }
});

/**
 * Hook personalizado para manejo de RUT
 * @param {Function} setValue - Función setValue de react-hook-form
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} Funciones y configuraciones para RUT
 */
export const useRutFormatter = (setValue, fieldName = 'run') => {
  const handleInput = (event) => handleRutInput(event, setValue, fieldName);
  
  const getFieldConfig = () => getRutFieldConfig(setValue, fieldName);
  
  const formatForAPI = (displayValue) => formatRutForAPI(displayValue);
  
  const formatForDisplay = (apiValue) => formatRutForDisplay(apiValue);
  
  const validate = (value) => isValidRut(value);
  
  return {
    handleInput,
    getFieldConfig,
    formatForAPI,
    formatForDisplay,
    validate,
    isValidFormat: isValidRutFormat,
    isValid: isValidRut
  };
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
  getRutFieldConfig,
  useRutFormatter
};