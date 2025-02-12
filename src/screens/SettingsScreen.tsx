import { useEffect, useState } from 'react';
import { View, FlatList, Alert, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useSQLiteContext } from 'expo-sqlite';
import { addPhotoAsync, fetchPhotosAsync, deletePhotoAsync, PhotoEntity } from '../database/database';
import { Linking } from 'react-native';
import { Card, FAB, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [photos, setPhotos] = useState<PhotoEntity[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntity | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  /** Cargar las fotos de la base de datos */
  async function loadPhotos() {
    const allPhotos = await fetchPhotosAsync(db);
    setPhotos(allPhotos);
  }

  /** Tomar una foto y guardar en la base de datos */
  async function takePhoto() {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitas permiso para usar la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitas permitir la ubicación para guardar la foto.');
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        await addPhotoAsync(db, uri, latitude, longitude);
        loadPhotos();
      } catch (error) {
        Alert.alert('Error', 'No se pudo obtener la ubicación.');
      }
    }
  }

  /** Abrir Google Maps con la ubicación */
  function openInMaps(latitude: number, longitude: number) {
    const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url);
  }

  /** Eliminar una foto con confirmación */
  function confirmDeletePhoto(id: number) {
    Alert.alert('Eliminar Foto', '¿Estás seguro de que quieres eliminar esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', onPress: () => deletePhoto(id), style: 'destructive' },
    ]);
  }

  async function deletePhoto(id: number) {
    await deletePhotoAsync(db, id);
    loadPhotos();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {selectedPhoto && (
          <Card style={styles.infoCard}>
            <Card.Title title="Información de la Foto" />
            <Card.Content>
              <List.Item
                title={`Latitud: ${selectedPhoto.latitude}`}
                description={`Longitud: ${selectedPhoto.longitude}`}
                left={() => <List.Icon icon="map-marker" />}
                onPress={() => openInMaps(selectedPhoto.latitude, selectedPhoto.longitude)}
              />
            </Card.Content>
          </Card>
        )}

        <FlatList
          data={photos}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => setSelectedPhoto(item)} onLongPress={() => confirmDeletePhoto(item.id)}>
              <Card.Cover source={{ uri: item.uri }} style={styles.image} />
            </Card>
          )}
        />

        <FAB style={styles.fab} icon="camera" onPress={takePhoto} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7f7' },
  container: { flex: 1, paddingHorizontal: 10 },
  list: { paddingBottom: 80 },
  infoCard: { marginBottom: 10, backgroundColor: '#ffffff' },
  card: { flex: 1, margin: 5, backgroundColor: '#ffffff' },
  image: { height: 150, borderRadius: 10 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#6200ee' },
});
