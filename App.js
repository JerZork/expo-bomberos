import 'react-native-gesture-handler';
import './global.css';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

import LoginScreen from './src/screens/Auth/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';
import { authService } from './src/services/authService';

export default function App() {
  const scheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Flags/rol dinámicos: cámbialos cuando integres con tu API
  const [featureFlags, setFeatureFlags] = useState({ emergencias: true });
  const [role, setRole] = useState('user');

  useEffect(() => {
    (async () => {
      const ok = await authService.isAuthenticated();
      setIsAuthenticated(!!ok);

      // Ejemplo: obtener flags/rol tras validar sesión
      // const { flags, role } = await authService.getSessionData();
      // setFeatureFlags(flags);
      // setRole(role);

      setBootstrapped(true);
    })();
  }, []);

  return (
    <SafeAreaProvider>
      {!bootstrapped ? (
        <View style={{ flex: 1, backgroundColor: 'white' }} />
      ) : !isAuthenticated ? (
        <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
      ) : (
        <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <TabNavigator
            onLogout={async () => setIsAuthenticated(false)}
            featureFlags={featureFlags}
            role={role}
          />
        </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
}
