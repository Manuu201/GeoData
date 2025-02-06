import React, { useEffect, useState } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSQLiteContext } from "expo-sqlite";
import { fetchPhotosAsync, type PhotoEntity } from "../database/database";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";

export default function OfflineMapScreen() {
  const db = useSQLiteContext();
  const [photos, setPhotos] = useState<PhotoEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    async function loadPhotos() {
      const storedPhotos = await fetchPhotosAsync(db);
      setPhotos(storedPhotos);
      setLoading(false);
    }
    loadPhotos();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
      ) : photos.length === 0 ? (
        <Text style={styles.noDataText}>No hay fotos con coordenadas registradas</Text>
      ) : (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: photos[0]?.latitude || 0,
            longitude: photos[0]?.longitude || 0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          mapType="none" // Evita descargar datos online
        >
          {photos.map((photo) => (
            <Marker
              key={photo.id}
              coordinate={{ latitude: photo.latitude, longitude: photo.longitude }}
              title="Foto Geológica"
              description={`Lat: ${photo.latitude.toFixed(6)}, Lon: ${photo.longitude.toFixed(6)}`}
            />
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: Dimensions.get("window").width, height: Dimensions.get("window").height },
  noDataText: { textAlign: "center", fontSize: 16, marginTop: 20, color: "#666" },
});
