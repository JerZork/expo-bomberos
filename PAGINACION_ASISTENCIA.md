# 📄 Sistema de Paginación en Asistencia

## ✨ Características implementadas

La sección de Asistencia ahora cuenta con un sistema completo de paginación que optimiza el rendimiento y mejora la experiencia de usuario.

### 🎯 Beneficios

1. **Rendimiento óptimo:**
   - Solo renderiza 50 bomberos por página
   - Elimina problemas de memoria con listas grandes
   - No más crashes por exceso de elementos

2. **Navegación intuitiva:**
   - Botones Anterior/Siguiente
   - Salto directo a primera/última página (⟪ ⟫)
   - Acceso rápido a páginas específicas
   - Indicador visual de página actual

3. **Búsqueda mejorada:**
   - El filtro funciona sobre todos los bomberos
   - La paginación se resetea al buscar
   - Muestra total de resultados filtrados

## 🔧 Configuración

### Cambiar items por página

En `CrearParteScreen.jsx`, línea ~258:

```jsx
const ITEMS_PER_PAGE = 50; // Cambiar este número (25, 50, 100, etc.)
```

**Recomendaciones:**
- 25-30 items: Ideal para dispositivos de gama baja
- 50 items: Balance óptimo (configuración actual)
- 100+ items: Solo para dispositivos potentes

## 📱 Uso para el usuario

### Navegación básica

1. **Cambiar página:**
   - Botón "← Anterior" para retroceder
   - Botón "Siguiente →" para avanzar

2. **Salto rápido:**
   - Botón `⟪` va a la primera página
   - Botón `⟫` va a la última página

3. **Acceso directo:**
   - Click en números de página (1, 2, 3...)
   - Solo se muestran páginas relevantes + cercanas

### Búsqueda

1. Escribe en el campo de búsqueda
2. La lista se filtra automáticamente
3. La paginación se ajusta a los resultados
4. Se resetea a página 1

### Información mostrada

```
Mostrando 50 de 237 bomberos
En el lugar: 12    En el cuartel: 8
                              Página 2 de 5

[⟪] [← Anterior] [ 2 / 5 ] [Siguiente →] [⟫]

[1] [2] [3] ⋯ [5]
```

## 🧩 Estructura del código

### Estado de paginación

```jsx
const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 50;
```

### Cálculo de páginas

```jsx
const totalPages = Math.ceil(filteredBomberos.length / ITEMS_PER_PAGE);

const paginatedBomberos = useMemo(
  () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredBomberos.slice(startIndex, endIndex);
  },
  [filteredBomberos, currentPage]
);
```

### Reset automático

```jsx
useEffect(() => {
  setCurrentPage(1); // Volver a página 1 al buscar
}, [searchAsistencia]);
```

## 🎨 UI Components

### Información de paginación

```jsx
<View>
  <Text>Mostrando {paginatedBomberos.length} de {filteredBomberos.length}</Text>
  <Text>Página {currentPage} de {totalPages}</Text>
</View>
```

### Controles de navegación

```jsx
// Primera página
<TouchableOpacity onPress={() => setCurrentPage(1)}>
  <Text>⟪</Text>
</TouchableOpacity>

// Página anterior
<TouchableOpacity onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
  <Text>← Anterior</Text>
</TouchableOpacity>

// Indicador actual
<View>
  <Text>{currentPage} / {totalPages}</Text>
</View>

// Página siguiente
<TouchableOpacity onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
  <Text>Siguiente →</Text>
</TouchableOpacity>

// Última página
<TouchableOpacity onPress={() => setCurrentPage(totalPages)}>
  <Text>⟫</Text>
</TouchableOpacity>
```

### Acceso rápido a páginas

```jsx
{Array.from({ length: totalPages }, (_, i) => {
  const pageNum = i + 1;
  
  // Lógica para mostrar solo páginas relevantes:
  // - Primeras 3 páginas
  // - Últimas 3 páginas
  // - Páginas cercanas a la actual (±1)
  
  return (
    <TouchableOpacity onPress={() => setCurrentPage(pageNum)}>
      <Text>{pageNum}</Text>
    </TouchableOpacity>
  );
})}
```

## ⚡ Optimizaciones implementadas

### 1. useMemo para evitar re-cálculos

```jsx
const paginatedBomberos = useMemo(
  () => filteredBomberos.slice(startIndex, endIndex),
  [filteredBomberos, currentPage]
);
```

### 2. useCallback para funciones

```jsx
const toggleLugar = useCallback((id, checked) => {
  setAsistenciaLugar(prev => ({ ...prev, [id]: checked }));
  if (checked) setAsistenciaCuartel(prev => ({ ...prev, [id]: false }));
}, []);
```

### 3. Renderizado condicional

Solo se renderizan los controles de paginación si hay más de 1 página:

```jsx
{totalPages > 1 && (
  <View>
    {/* Controles */}
  </View>
)}
```

## 📊 Escenarios de uso

### Ejemplo 1: Compañía pequeña (20 bomberos)

- Total páginas: 1
- No se muestran controles de paginación
- Todos visibles en una sola vista

### Ejemplo 2: Compañía mediana (150 bomberos)

- Total páginas: 3 (50 por página)
- Navegación: [⟪] [← Anterior] [1 / 3] [Siguiente →] [⟫]
- Páginas rápidas: [1] [2] [3]

### Ejemplo 3: Compañía grande (500 bomberos)

- Total páginas: 10
- Navegación completa con saltos rápidos
- Páginas rápidas: [1] [2] [3] ⋯ [9] [10]
- Búsqueda recomendada para encontrar bomberos específicos

### Ejemplo 4: Búsqueda activa

Usuario busca "Juan":
- 15 resultados encontrados
- Total páginas: 1
- Muestra: "Mostrando 15 de 500 bomberos"

## 🐛 Prevención de errores

### Sin VirtualizedList anidado

- ✅ No usa FlatList (evita error de nesting)
- ✅ Renderiza solo elementos visibles (paginación)
- ✅ No hay scroll interno conflictivo

### Límite de elementos

- ✅ Máximo 50 elementos por página
- ✅ Siempre renderizado predecible
- ✅ Memoria bajo control

### Estado consistente

- ✅ Página se resetea al buscar
- ✅ Validación de límites (min: 1, max: totalPages)
- ✅ Botones deshabilitados en extremos

## 🚀 Mejoras futuras (opcionales)

### 1. Selección masiva por página

```jsx
const selectAllOnPage = () => {
  paginatedBomberos.forEach(b => {
    setAsistenciaLugar(prev => ({ ...prev, [b.id]: true }));
  });
};
```

### 2. Guardar página en state persistente

```jsx
import AsyncStorage from '@react-native-async-storage/async-storage';

useEffect(() => {
  AsyncStorage.setItem('lastAsistenciaPage', String(currentPage));
}, [currentPage]);
```

### 3. Indicador de bomberos seleccionados por página

```jsx
const selectedOnPage = paginatedBomberos.filter(b => 
  asistenciaLugar[b.id] || asistenciaCuartel[b.id]
).length;

<Text>Seleccionados en esta página: {selectedOnPage}</Text>
```

### 4. Ordenamiento

```jsx
const [sortBy, setSortBy] = useState('nombre'); // 'nombre', 'apellido', 'run'

const sortedBomberos = useMemo(() => {
  return [...filteredBomberos].sort((a, b) => {
    if (sortBy === 'nombre') {
      return nombreBombero(a).localeCompare(nombreBombero(b));
    }
    // ... otros criterios
  });
}, [filteredBomberos, sortBy]);
```

## 💡 Tips de uso

1. **Para listas muy grandes (1000+):**
   - Usa el buscador primero
   - Aumenta ITEMS_PER_PAGE a 100

2. **Para mejor UX:**
   - Mantén 50 items/página
   - Usa acceso rápido a páginas
   - Scroll automático al cambiar página (opcional)

3. **Para debugging:**
   - Verifica `totalPages` en consola
   - Revisa `paginatedBomberos.length`
   - Monitorea `currentPage` state

## 🔗 Referencias

- [React Hooks - useMemo](https://react.dev/reference/react/useMemo)
- [React Hooks - useCallback](https://react.dev/reference/react/useCallback)
- [Paginación en React](https://www.freecodecamp.org/news/build-a-custom-pagination-component-in-react/)
