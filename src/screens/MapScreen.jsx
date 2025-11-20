import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Modal, ScrollView, Linking, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getPuntosGeograficos } from '../services/puntoGeografico.service';
import { getTiposPunto } from '../services/tipoPunto.service';
import { getIconName, IconFamily } from '../helpers/iconMapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [points, setPoints] = useState([]);
  const [tiposPunto, setTiposPunto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const mapRef = useRef(null);

  const mapStyle = [
    {
      "featureType": "poi",
      "elementType": "labels",
      "stylers": [
        { "visibility": "off" }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        { "visibility": "off" }
      ]
    },
    {
      "featureType": "transit",
      "stylers": [
        { "visibility": "off" }
      ]
    }
  ];

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permiso de ubicación denegado');
          setLoading(false);
          return;
        }

        let userLocation = await Location.getCurrentPositionAsync({});
        setLocation(userLocation);
      } catch (error) {
        console.error("Error getting location:", error);
        setErrorMsg('Error al obtener la ubicación');
      }
    })();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pointsData, tiposData] = await Promise.all([
          getPuntosGeograficos(),
          getTiposPunto()
        ]);

        if (pointsData && pointsData.data) {
          setPoints(pointsData.data);
        } else if (Array.isArray(pointsData)) {
          setPoints(pointsData);
        }

        if (tiposData && tiposData.data) {
          setTiposPunto(tiposData.data);
        } else if (Array.isArray(tiposData)) {
          setTiposPunto(tiposData);
        }

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCenterLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      Alert.alert('Aviso', 'Ubicación no disponible aún.');
    }
  };

  const handleOpenMaps = () => {
    if (!selectedPoint) return;
    const lat = parseFloat(selectedPoint.coordenadas?.lat || selectedPoint.latitud);
    const lng = parseFloat(selectedPoint.coordenadas?.lng || selectedPoint.longitud);
    const label = encodeURIComponent(selectedPoint.nombre);

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });

    // Fallback to web URL if scheme fails or just use web url for simplicity in some cases
    // But let's try the native scheme first, or the universal google maps url
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(webUrl);
      }
    });
  };

  const handleDirections = () => {
    if (!selectedPoint) return;
    const lat = parseFloat(selectedPoint.coordenadas?.lat || selectedPoint.latitud);
    const lng = parseFloat(selectedPoint.coordenadas?.lng || selectedPoint.longitud);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (loading && !location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="mt-2 text-gray-600">Obteniendo ubicación...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text className="text-red-500 text-lg">{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle}
        showsUserLocation={true}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        showsCompass={true}
        mapPadding={{ top: 50, right: 10, bottom: 10, left: 10 }}
        compassOffset={{ x: -10, y: 50 }}
        onPress={() => setSelectedPoint(null)}
        initialRegion={{
          latitude: -37.0333, // Cabrero
          longitude: -72.4000,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {points.map((point) => {
          let lat = parseFloat(point.coordenadas?.lat);
          let lng = parseFloat(point.coordenadas?.lng);

          if (isNaN(lat)) lat = parseFloat(point.latitud);
          if (isNaN(lng)) lng = parseFloat(point.longitud);

          if (isNaN(lat) || isNaN(lng)) return null;

          const iconName = getIconName(point.tipoPunto?.icono);
          const iconColor = point.tipoPunto?.color || '#ef4444';

          return (
            <Marker
              key={point.id}
              coordinate={{
                latitude: lat,
                longitude: lng,
              }}
              title={point.nombre}
              description={point.descripcion || point.tipoPunto?.nombre}
              onPress={() => setSelectedPoint(point)}
            >
              <View style={[styles.markerContainer, { backgroundColor: iconColor }]}>
                <IconFamily name={iconName} size={20} color="white" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Custom Toolbar (Top Right) */}
      {selectedPoint && (
        <View style={styles.toolbarContainer}>
          <TouchableOpacity onPress={handleDirections} style={styles.toolbarButton}>
            <MaterialIcons name="directions" size={24} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenMaps} style={styles.toolbarButton}>
            <Ionicons name="map" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>
      )}

      {/* My Location Button */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={handleCenterLocation}
      >
        <Ionicons name="locate" size={24} color="#333" />
      </TouchableOpacity>

      {/* Legend Button */}
      <TouchableOpacity
        style={styles.legendButton}
        onPress={() => setShowLegend(true)}
      >
        <Ionicons name="list" size={24} color="white" />
        <Text style={styles.legendButtonText}>Leyenda</Text>
      </TouchableOpacity>

      {/* Legend Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLegend}
        onRequestClose={() => setShowLegend(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Leyenda</Text>
              <TouchableOpacity onPress={() => setShowLegend(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.legendList}>
              {tiposPunto.map((tipo) => (
                <View key={tipo.id} style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: tipo.color || '#999' }]}>
                    <IconFamily name={getIconName(tipo.icono)} size={16} color="white" />
                  </View>
                  <Text style={styles.legendText}>{tipo.nombre}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 100, // Above legend button
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  legendButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  legendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  toolbarContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    alignItems: 'center',
  },
  toolbarButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  legendList: {
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  legendText: {
    fontSize: 16,
    color: '#444',
  },
});

export default MapScreen;
