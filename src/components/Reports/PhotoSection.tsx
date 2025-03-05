import React, { useState } from "react";
import { View, Image, StyleSheet, Alert } from "react-native";
import { Button, Icon, Text, Card } from "@ui-kitten/components";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";


/**
 * Props para el componente PhotoSection.
 * 
 * @property {string | null} photoUri - URI de la foto capturada.
 * @property {(uri: string | null) => void} setPhotoUri - Función para actualizar la URI de la foto.
 * @property {number} latitude - Latitud de la ubicación donde se tomó la foto.
 * @property {(latitude: number) => void} setLatitude - Función para actualizar la latitud.
 * @property {number} longitude - Longitud de la ubicación donde se tomó la foto.
 * @property {(longitude: number) => void} setLongitude - Función para actualizar la longitud.
 */

/**
 * Componente que permite al usuario tomar una foto, capturar su ubicación y mostrar la imagen junto con las coordenadas.
 * 
 * @param {PhotoSection} props - Las propiedades del componente.
 * @returns {JSX.Element} - El componente renderizado.
 */
const PhotoSection = ({ photoUri, setPhotoUri, latitude, setLatitude, longitude, setLongitude }) => {
  const [showCropOption, setShowCropOption] = useState(false); // Estado para mostrar la opción de recorte

  const handleTakePhoto = async (allowsEditing = false) => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== "granted") {
      alert("Se necesitan permisos para acceder a la cámara.");
      return;
    }

    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== "granted") {
      alert("Se necesitan permisos para acceder a la ubicación.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing, // Permite o no la edición según la elección del usuario
      aspect: [4, 3], // Relación de aspecto para el recorte (solo aplica si allowsEditing es true)
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
      } catch (error) {
        console.error("Error al obtener la ubicación:", error);
        alert("No se pudo obtener la ubicación. Asegúrate de que los servicios de ubicación estén activados.");
      }

      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleCropOption = () => {
    Alert.alert(
      "Ajustar Imagen",
      "¿Deseas recortar la imagen?",
      [
        {
          text: "Sí",
          onPress: () => handleTakePhoto(true), // Permite recortar la imagen
        },
        {
          text: "No",
          onPress: () => handleTakePhoto(false), // Toma la foto completa
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View>
      <Button onPress={handleCropOption} style={styles.button} accessoryLeft={(props) => <Icon {...props} name="camera-outline" />}>
        Tomar Foto
      </Button>
      {photoUri ? (
        <Card style={styles.photoCard}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <Text category="s1" style={styles.coordinatesText}>
            Latitud: {latitude.toFixed(6)}, Longitud: {longitude.toFixed(6)}
          </Text>
        </Card>
      ) : (
        <Text style={styles.noPhotoText}>No se ha tomado ninguna foto.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginBottom: 16,
  },
  photoCard: {
    marginBottom: 16,
  },
  photo: {
    width: "100%",
    height: 200,
    resizeMode: "cover", // Ajusta la imagen al contenedor sin distorsionarla
    marginBottom: 16,
  },
  coordinatesText: {
    marginBottom: 16,
    textAlign: "center",
  },
  noPhotoText: {
    textAlign: "center",
    marginBottom: 16,
    color: "gray",
  },
});

export default PhotoSection;
