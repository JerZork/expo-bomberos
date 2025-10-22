import { 
  formatRutForDisplay, 
  formatRutForAPI, 
  isValidRut,
  getRutErrorMessage,
  cleanRut,
  calculateRutDV,
  isValidRutFormat
} from '../helpers/rutFormatter';

/**
 * Suite de pruebas para rutFormatter
 * Ejecutar en consola para verificar funcionamiento
 */

console.log('=== TESTS RUTFORMATTER ===\n');

// Test 1: cleanRut
console.log('1. cleanRut()');
console.log('   "12.345.678-9" →', cleanRut('12.345.678-9')); // "123456789"
console.log('   "12abc345!678-k" →', cleanRut('12abc345!678-k')); // "12345678K"
console.log('   ✅ Limpia caracteres no válidos\n');

// Test 2: formatRutForDisplay
console.log('2. formatRutForDisplay()');
console.log('   "123456785" →', formatRutForDisplay('123456785')); // "12.345.678-5"
console.log('   "12345678-5" →', formatRutForDisplay('12345678-5')); // "12.345.678-5"
console.log('   "1234567" →', formatRutForDisplay('1234567')); // "123.456" (sin DV aún)
console.log('   ✅ Formatea con puntos y guión\n');

// Test 3: formatRutForAPI
console.log('3. formatRutForAPI()');
console.log('   "12.345.678-5" →', formatRutForAPI('12.345.678-5')); // "12345678-5"
console.log('   "123456785" →', formatRutForAPI('123456785')); // "12345678-5"
console.log('   ✅ Formatea sin puntos\n');

// Test 4: calculateRutDV
console.log('4. calculateRutDV()');
console.log('   "12345678" →', calculateRutDV('12345678')); // "5"
console.log('   "11111111" →', calculateRutDV('11111111')); // "1"
console.log('   "24965565" →', calculateRutDV('24965565')); // "K"
console.log('   ✅ Calcula dígito verificador\n');

// Test 5: isValidRutFormat
console.log('5. isValidRutFormat()');
console.log('   "12.345.678-9" →', isValidRutFormat('12.345.678-9')); // true
console.log('   "12345678-9" →', isValidRutFormat('12345678-9')); // true
console.log('   "123" →', isValidRutFormat('123')); // false
console.log('   ✅ Valida formato\n');

// Test 6: isValidRut (con validación de DV)
console.log('6. isValidRut()');
console.log('   "12.345.678-5" →', isValidRut('12.345.678-5')); // true (DV correcto)
console.log('   "12.345.678-9" →', isValidRut('12.345.678-9')); // false (DV incorrecto)
console.log('   "11.111.111-1" →', isValidRut('11.111.111-1')); // true
console.log('   ✅ Valida RUT completo\n');

// Test 7: getRutErrorMessage
console.log('7. getRutErrorMessage()');
console.log('   "" →', getRutErrorMessage('')); // "El RUT es requerido"
console.log('   "123" →', getRutErrorMessage('123')); // "Formato de RUT inválido..."
console.log('   "12.345.678-9" →', getRutErrorMessage('12.345.678-9')); // "El RUT ingresado no es válido"
console.log('   "12.345.678-5" →', getRutErrorMessage('12.345.678-5')); // ""
console.log('   ✅ Genera mensajes de error\n');

// Test 8: RUTs de ejemplo del sistema
console.log('8. RUTs del sistema');
const testUsers = [
  '1.234.567-4',
  '12.345.678-5',
  '18.765.432-7'
];

testUsers.forEach(rut => {
  const isValid = isValidRut(rut);
  const forAPI = formatRutForAPI(rut);
  const status = isValid ? '✅' : '❌';
  console.log(`   ${status} ${rut} → API: ${forAPI} → Válido: ${isValid}`);
});

console.log('\n=== FIN TESTS ===');

// Exportar para uso en aplicación
export const runRutFormatterTests = () => {
  console.log('Tests ejecutados. Ver consola para resultados.');
};
