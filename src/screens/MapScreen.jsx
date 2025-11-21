import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Modal, ScrollView, Linking, Platform } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getPuntosGeograficos } from '../services/puntoGeografico.service';
import { getTiposPunto } from '../services/tipoPunto.service';
import { getJurisdicciones } from '../services/jurisdiccion.service';
import { getIconName, IconFamily } from '../helpers/iconMapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [points, setPoints] = useState([]);
  const [tiposPunto, setTiposPunto] = useState([]);
  const [jurisdicciones, setJurisdicciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

  // Selection states
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(null);

  // Filter states
  const [visiblePointTypes, setVisiblePointTypes] = useState({});
  const [showJurisdictions, setShowJurisdictions] = useState(true);

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
        const [pointsData, tiposData, jurisdiccionesData] = await Promise.all([
          getPuntosGeograficos(),
          getTiposPunto(),
          getJurisdicciones()
        ]);

        if (pointsData && pointsData.data) {
          setPoints(pointsData.data);
        } else if (Array.isArray(pointsData)) {
          setPoints(pointsData);
        }

        let loadedTipos = [];
        if (tiposData && tiposData.data) {
          loadedTipos = tiposData.data;
        } else if (Array.isArray(tiposData)) {
          loadedTipos = tiposData;
        }
        setTiposPunto(loadedTipos);

        // Initialize all types as visible
        const initialVisibility = {};
        loadedTipos.forEach(tipo => {
          initialVisibility[tipo.id] = true;
        });
        setVisiblePointTypes(initialVisibility);

        if (jurisdiccionesData && jurisdiccionesData.data) {
          setJurisdicciones(jurisdiccionesData.data);
        } else if (Array.isArray(jurisdiccionesData)) {
          setJurisdicciones(jurisdiccionesData);
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

  const togglePointType = (id) => {
    setVisiblePointTypes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleMapPress = () => {
    setSelectedPoint(null);
    setSelectedJurisdiction(null);
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
        onPress={handleMapPress}
        initialRegion={{
          latitude: -37.0333, // Cabrero
          longitude: -72.4000,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {showJurisdictions && jurisdicciones.map((jurisdiccion) => {
          if (!jurisdiccion.coordenadas || jurisdiccion.coordenadas.length === 0) return null;

          const coordinates = jurisdiccion.coordenadas.map(coord => ({
            latitude: parseFloat(coord.lat),
            longitude: parseFloat(coord.lng),
          }));

          if (coordinates.length > 0 && (coordinates[0].latitude !== coordinates[coordinates.length - 1].latitude || coordinates[0].longitude !== coordinates[coordinates.length - 1].longitude)) {
            coordinates.push(coordinates[0]);
          }

          const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };

          const fillColor = jurisdiccion.color ? hexToRgba(jurisdiccion.color, 0.15) : 'rgba(34, 197, 94, 0.15)';
          const strokeColor = jurisdiccion.color || '#16a34a';

          return (
            <Polygon
              key={jurisdiccion.id}
              coordinates={coordinates}
              fillColor={fillColor}
              strokeColor={strokeColor}
              strokeWidth={2}
              tappable={true}
              onPress={(e) => {
                e.stopPropagation(); // Prevent map press
                setSelectedPoint(null);
                setSelectedJurisdiction(jurisdiccion);
              }}
            />
          );
        })}

        {points.map((point) => {
          // Check visibility filter
          if (!visiblePointTypes[point.tipoPunto?.id]) return null;

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
              onPress={(e) => {
                e.stopPropagation();
                setSelectedJurisdiction(null);
                setSelectedPoint(point);
              }}
            >
              <View style={[styles.markerContainer, { backgroundColor: iconColor }]}>
                <IconFamily name={iconName} size={20} color="white" />
              </View>
            </Marker>
          );
        })}
      </MapView>

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

      {/* Detail Card (Bottom Sheet style) */}
      {(selectedPoint || selectedJurisdiction) && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.headerTitleContainer}>
              <View style={[
                styles.headerIconContainer,
                { backgroundColor: selectedPoint ? (selectedPoint.tipoPunto?.color || '#ef4444') : '#16a34a' }
              ]}>
                <IconFamily
                  name={selectedPoint ? getIconName(selectedPoint.tipoPunto?.icono) : "layers"}
                  size={24}
                  color="white"
                />
              </View>
              <View>
                <Text style={styles.detailSubtitle}>
                  {selectedPoint ? (selectedPoint.tipoPunto?.nombre || 'Punto de Interés') : 'Jurisdicción / Área'}
                </Text>
                <Text style={styles.detailTitle}>
                  {selectedPoint ? selectedPoint.nombre : selectedJurisdiction.nombre}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => {
              setSelectedPoint(null);
              setSelectedJurisdiction(null);
            }} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailBody}>
            <View style={styles.detailRow}>
              <Ionicons name="information-circle-outline" size={20} color="#6b7280" style={styles.detailRowIcon} />
              <Text style={styles.detailDescription}>
                {selectedPoint
                  ? (selectedPoint.descripcion || "Sin descripción disponible.")
                  : (selectedJurisdiction.descripcion || "Sin descripción disponible.")
                }
              </Text>
            </View>

            {/* Additional info for Jurisdictions could go here */}
            {selectedJurisdiction && (
              <View style={styles.detailRow}>
                <MaterialIcons name="public" size={20} color="#6b7280" style={styles.detailRowIcon} />
                <Text style={styles.detailInfoText}>Zona geográfica delimitada</Text>
              </View>
            )}
          </View>

          {selectedPoint && (
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={handleDirections} style={styles.actionButton}>
                <MaterialIcons name="directions" size={20} color="white" />
                <Text style={styles.actionButtonText}>Cómo llegar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenMaps} style={[styles.actionButton, styles.secondaryButton]}>
                <Ionicons name="map" size={20} color="#2563eb" />
                <Text style={styles.secondaryButtonText}>Abrir en Maps</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

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
              <Text style={styles.modalTitle}>Filtros y Leyenda</Text>
              <TouchableOpacity onPress={() => setShowLegend(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.legendList}>
              {/* Jurisdictions Toggle */}
              <TouchableOpacity
                style={styles.legendItem}
                onPress={() => setShowJurisdictions(!showJurisdictions)}
              >
                <View style={styles.checkboxContainer}>
                  <Ionicons
                    name={showJurisdictions ? "checkbox" : "square-outline"}
                    size={24}
                    color="#2563eb"
                  />
                </View>
                <View style={[styles.legendIcon, { backgroundColor: 'rgba(34, 197, 94, 0.5)', borderColor: '#16a34a', borderWidth: 1 }]}>
                  <MaterialIcons name="layers" size={16} color="white" />
                </View>
                <Text style={styles.legendText}>Áreas / Jurisdicciones</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Point Types Toggles */}
              {tiposPunto.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={styles.legendItem}
                  onPress={() => togglePointType(tipo.id)}
                >
                  <View style={styles.checkboxContainer}>
                    <Ionicons
                      name={visiblePointTypes[tipo.id] ? "checkbox" : "square-outline"}
                      size={24}
                      color="#2563eb"
                    />
                  </View>
                  <View style={[styles.legendIcon, { backgroundColor: tipo.color || '#999' }]}>
                    <IconFamily name={getIconName(tipo.icono)} size={16} color="white" />
                  </View>
                  <Text style={styles.legendText}>{tipo.nombre}</Text>
                </TouchableOpacity>
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
    maxHeight: '60%',
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
    paddingVertical: 4,
  },
  checkboxContainer: {
    marginRight: 10,
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
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  detailCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  detailBody: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailRowIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailDescription: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    flex: 1,
  },
  detailInfoText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 0,
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
});

export default MapScreen;
