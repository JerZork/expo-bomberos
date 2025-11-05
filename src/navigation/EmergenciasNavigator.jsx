import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EmergenciasScreen from '../screens/Emergencias/EmergenciasScreen';
import DetalleParteScreen from '../screens/Emergencias/DetalleParteScreen';
import CrearParteScreen from '../screens/Emergencias/CrearParteScreen';
import EditarParteScreen from '../screens/Emergencias/EditarParteScreen';

const Stack = createStackNavigator();

export default function EmergenciasNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="EmergenciasList" 
        component={EmergenciasScreen} 
      />
      <Stack.Screen 
        name="DetalleParte" 
        component={DetalleParteScreen}
      />
      <Stack.Screen 
        name="CrearParte" 
        component={CrearParteScreen}
      />
      <Stack.Screen 
        name="EditarParte" 
        component={EditarParteScreen}
      />
    </Stack.Navigator>
  );
}
