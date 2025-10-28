import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import EmergenciasScreen from '../screens/Emergencias/EmergenciasScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

/**
 * Recibe:
 * - onLogout: función para cerrar sesión (se pasa a Home/Profile si quieres)
 * - featureFlags: { emergencias?: boolean } (puedes añadir más)
 * - role: 'admin' | 'user' | 'guest'  (opcional, por si quieres filtrar por rol)
 */
export default function TabNavigator({ onLogout, featureFlags = {}, role = 'user' }) {
  const Tab = createBottomTabNavigator();

  // Configuración declarativa de TODAS las tabs posibles
  const allTabs = useMemo(
    () => [
      {
        key: 'home',
        name: 'Inicio',
        label: 'Inicio',
        // usar render para pasar props personalizados
        render: (props) => <HomeScreen {...props} onLogout={onLogout} />,
        icon: 'home',
        showWhen: () => true, // siempre visible
      },
      {
        key: 'emergencias',
        name: 'Emergencias',
        label: 'Emergencias',
        component: EmergenciasScreen,
        icon: 'flame',
        showWhen: () => featureFlags.emergencias !== false, // visible salvo que lo apagues
      },
      {
        key: 'perfil',
        name: 'Perfil',
        label: 'Perfil',
        // usar render para pasar props personalizados
        render: (props) => <ProfileScreen {...props} onLogout={onLogout} />,
        icon: 'person',
        showWhen: () => true,
      },
      // Ejemplo de tab restringida por rol (descomenta si la necesitas):
      // {
      //   key: 'admin',
      //   name: 'Admin',
      //   label: 'Admin',
      //   component: AdminScreen,
      //   icon: 'settings',
      //   showWhen: () => role === 'admin',
      // },
    ],
    [featureFlags.emergencias, onLogout, role]
  );

  // Filtra dinámicamente según flags/rol
  const visibleTabs = allTabs.filter(t => (t.showWhen ? t.showWhen() : true));
  const safeTabs = visibleTabs.length > 0 ? visibleTabs : allTabs.filter(t => t.key === 'home');

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#d00',
        tabBarInactiveTintColor: '#777',
          animation: 'shift',
      }}
    >
      {safeTabs.map(tab => {
        const options = {
          title: tab.label ?? tab.name,
          tabBarIcon: ({ size, color }) => (
            <Ionicons name={tab.icon} size={size ?? 22} color={color} />
          ),
        };

        // Si la tab define "render", usamos children para evitar inline en component
        if (tab.render) {
          return (
            <Tab.Screen key={tab.key} name={tab.name} options={options}>
              {(props) => tab.render(props)}
            </Tab.Screen>
          );
        }

        // Si trae un componente directo, lo usamos en component
        return (
          <Tab.Screen
            key={tab.key}
            name={tab.name}
            component={tab.component}
            options={options}
          />
        );
      })}
    </Tab.Navigator>
  );
}
