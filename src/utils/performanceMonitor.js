/**
 * Utilidad para monitorear el rendimiento y detectar problemas de memoria
 */

// Contador de renders para detectar re-renders excesivos
export const useRenderCount = (componentName) => {
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    renderCount.current += 1;
    if (renderCount.current > 50) {
      console.warn(`⚠️ [${componentName}] Ha renderizado ${renderCount.current} veces. Posible loop infinito.`);
    }
  });
  
  return renderCount.current;
};

// Monitorear tamaño de arrays en estado
export const monitorArraySize = (arrayName, array, maxSize = 1000) => {
  if (Array.isArray(array) && array.length > maxSize) {
    console.warn(`⚠️ Array "${arrayName}" tiene ${array.length} elementos (máximo recomendado: ${maxSize})`);
  }
};

// Verificar AsyncStorage
export const checkStorageSize = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const keys = await AsyncStorage.getAllKeys();
    let totalSize = 0;
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      const size = value ? value.length : 0;
      totalSize += size;
      
      if (size > 100000) { // > 100KB
        console.warn(`⚠️ AsyncStorage key "${key}" es muy grande: ${(size / 1024).toFixed(2)} KB`);
      }
    }
    
    console.log(`📊 AsyncStorage total: ${keys.length} keys, ${(totalSize / 1024).toFixed(2)} KB`);
    
    if (totalSize > 5000000) { // > 5MB
      console.error(`❌ AsyncStorage excede 5MB. Limpia datos innecesarios.`);
    }
    
    return { keys: keys.length, totalSize };
  } catch (error) {
    console.error('Error al verificar AsyncStorage:', error);
    return null;
  }
};

// Detectar memory leaks por listeners no limpiados
export const useEffectDebug = (effect, deps, componentName) => {
  React.useEffect(() => {
    console.log(`🔄 [${componentName}] useEffect ejecutado con deps:`, deps);
    const cleanup = effect();
    
    return () => {
      if (cleanup) {
        console.log(`🧹 [${componentName}] Limpieza ejecutada`);
        cleanup();
      }
    };
  }, deps);
};

export default {
  useRenderCount,
  monitorArraySize,
  checkStorageSize,
  useEffectDebug,
};
