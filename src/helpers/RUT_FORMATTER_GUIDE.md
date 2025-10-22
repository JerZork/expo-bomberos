# RUT Formatter Helper - React Native

Helper completo para manejo de RUT chileno en aplicaciones React Native.

## Características

- ✅ **Formateo automático**: Agrega puntos y guión mientras el usuario escribe
- ✅ **Validación completa**: Verifica formato y dígito verificador
- ✅ **Doble formato**: Para visualización (12.345.678-9) y para API (12345678-9)
- ✅ **Limpieza de datos**: Remueve caracteres no válidos
- ✅ **Cálculo de DV**: Calcula y valida el dígito verificador

## Uso Básico

### Importar funciones

```javascript
import { 
  formatRutForDisplay, 
  formatRutForAPI, 
  isValidRut,
  getRutErrorMessage 
} from '../../helpers/rutFormatter';
```

### Formateo automático en TextInput

```javascript
const [run, setRun] = useState('');

const handleRunChange = (text) => {
  const formatted = formatRutForDisplay(text);
  setRun(formatted);
};

<TextInput
  value={run}
  onChangeText={handleRunChange}
  placeholder="12.345.678-9"
  keyboardType="number-pad"
  maxLength={12}
/>
```

### Validación antes de enviar

```javascript
const handleSubmit = async () => {
  // Validar
  if (!isValidRut(run)) {
    Alert.alert('Error', 'El RUT ingresado no es válido');
    return;
  }
  
  // Formatear para API (sin puntos)
  const formattedRut = formatRutForAPI(run); // "12345678-9"
  
  // Enviar a la API
  await api.post('/endpoint', { run: formattedRut });
};
```

### Mensajes de error personalizados

```javascript
const [error, setError] = useState('');

const validateRut = () => {
  const errorMsg = getRutErrorMessage(run);
  setError(errorMsg);
  return !errorMsg;
};
```

## API de Funciones

### `formatRutForDisplay(run: string): string`
Formatea el RUT para mostrar al usuario con puntos y guión.
```javascript
formatRutForDisplay('123456789') // "12.345.678-9"
formatRutForDisplay('12345678-9') // "12.345.678-9"
formatRutForDisplay('12.345.678-9') // "12.345.678-9"
```

### `formatRutForAPI(run: string): string`
Formatea el RUT para enviar a la API (sin puntos, solo guión).
```javascript
formatRutForAPI('12.345.678-9') // "12345678-9"
formatRutForAPI('123456789') // "12345678-9"
```

### `isValidRut(run: string): boolean`
Valida si el RUT es correcto (formato y dígito verificador).
```javascript
isValidRut('12.345.678-5') // true
isValidRut('12.345.678-9') // false (DV incorrecto)
isValidRut('123') // false (formato incorrecto)
```

### `isValidRutFormat(run: string): boolean`
Valida solo el formato (no verifica el DV).
```javascript
isValidRutFormat('12.345.678-9') // true
isValidRutFormat('1234567') // false
```

### `cleanRut(run: string): string`
Limpia el RUT removiendo caracteres no válidos.
```javascript
cleanRut('12.345.678-9') // "123456789"
cleanRut('12abc345!678-k') // "12345678K"
```

### `calculateRutDV(rutBody: string): string`
Calcula el dígito verificador de un RUT.
```javascript
calculateRutDV('12345678') // "5"
calculateRutDV('11111111') // "1"
```

### `getRutErrorMessage(run: string): string`
Retorna un mensaje de error apropiado o string vacío si es válido.
```javascript
getRutErrorMessage('') // "El RUT es requerido"
getRutErrorMessage('123') // "Formato de RUT inválido (ej: 12.345.678-9)"
getRutErrorMessage('12.345.678-9') // "El RUT ingresado no es válido"
getRutErrorMessage('12.345.678-5') // ""
```

## Ejemplo Completo: Formulario de Login

```javascript
import React, { useState } from 'react';
import { TextInput, Button, Text } from 'react-native';
import { formatRutForDisplay, formatRutForAPI, getRutErrorMessage } from './helpers/rutFormatter';

function LoginForm() {
  const [run, setRun] = useState('');
  const [error, setError] = useState('');

  const handleRunChange = (text) => {
    setRun(formatRutForDisplay(text));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    const errorMsg = getRutErrorMessage(run);
    
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    const formattedRut = formatRutForAPI(run);
    
    // Enviar a la API
    await loginService(formattedRut, password);
  };

  return (
    <>
      <TextInput
        value={run}
        onChangeText={handleRunChange}
        placeholder="12.345.678-9"
        keyboardType="number-pad"
        maxLength={12}
      />
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button title="Ingresar" onPress={handleSubmit} />
    </>
  );
}
```

## Notas Importantes

1. **keyboardType**: Usa `"number-pad"` en iOS y `"numeric"` en Android para mejor UX
2. **maxLength**: Limita a 12 caracteres (formato: `12.345.678-9`)
3. **Formato API**: Siempre envía sin puntos: `12345678-9`
4. **Formato Display**: Siempre muestra con puntos: `12.345.678-9`
5. **Validación**: Valida tanto formato como dígito verificador

## Casos de Uso

### Seleccionar usuario predefinido
```javascript
const selectUser = (user) => {
  setRun(formatRutForDisplay(user.run)); // Formatea automáticamente
};
```

### Copiar/Pegar RUT
El helper limpia y formatea automáticamente cualquier formato pegado.

### RUTs desde la API
```javascript
const userData = await api.get('/user');
// userData.run viene como "12345678-9"
setRun(formatRutForDisplay(userData.run)); // Muestra "12.345.678-9"
```
