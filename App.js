import './global.css';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/Auth/LoginScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import { authService } from './src/services/authService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    (async () => {
      const ok = await authService.isAuthenticated();
      setIsAuthenticated(!!ok);
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
        <HomeScreen onLogout={async () => setIsAuthenticated(false)} />
      )}
    </SafeAreaProvider>
  );
}
