import { useEffect, useState } from 'react';
import { View, Button, Image, FlatList, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useSQLiteContext } from 'expo-sqlite';
import { addPhotoAsync, fetchPhotosAsync, deletePhotoAsync, PhotoEntity } from '../database/database';
import { Linking } from 'react-native';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [photos, setPhotos] = useState<PhotoEntity[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntity | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);


// Función para abrir Google Maps con la ubicación
function openInMaps(latitude: number, longitude: number) {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  }

  /** Cargar las fotos de la base de datos */
  async function loadPhotos() {
    const allPhotos = await fetchPhotosAsync(db);
    setPhotos(allPhotos);
  }

  /** Tomar una foto y guardar en la base de datos */
  async function takePhoto() {
    console.log('📷 Intentando tomar una foto...');
    
    // Pedir permisos de cámara
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitas permiso para usar la cámara');
      return;
    }
  
    // Abrir la cámara
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Fix de advertencia
      allowsEditing: true,
      quality: 1,
    });
  
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log('✅ Foto tomada:', uri);
  
      // 🚨 SOLUCIÓN: Pedir permiso de ubicación antes de obtener la posición
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitas permitir la ubicación para guardar la foto.');
        return;
      }
  
      console.log('⏳ Obteniendo ubicación...');
      try {
        const location = await Location.getCurrentPositionAsync({});
        const latitude = location.coords.latitude;
        const longitude = location.coords.longitude;
        console.log('📍 Ubicación obtenida:', latitude, longitude);
  
        console.log('📝 Intentando insertar en la base de datos...');
        await addPhotoAsync(db, uri, latitude, longitude);
        console.log('✅ Foto guardada en la base de datos');
  
        loadPhotos(); // Recargar lista
      } catch (error) {
        console.error('❌ Error obteniendo ubicación:', error);
        Alert.alert('Error', 'No se pudo obtener la ubicación.');
      }
    } else {
      console.log('❌ Captura cancelada');
    }
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
    <View style={styles.container}>
      <Button title="Tomar Foto" onPress={takePhoto} />
      
      {selectedPhoto && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>📍 Ubicación: {selectedPhoto.latitude}, {selectedPhoto.longitude}</Text>
        </View>
      )}

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedPhoto(item)} onLongPress={() => confirmDeletePhoto(item.id)}>
            <Image source={{ uri: item.uri }} style={styles.image} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  infoContainer: { marginVertical: 10, padding: 10, backgroundColor: '#ddd', borderRadius: 5 },
  infoText: { fontSize: 16, textAlign: 'center' },
  image: { width: 150, height: 150, margin: 5, borderRadius: 10 },
});
