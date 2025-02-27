import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Button, Icon, Text, Card } from "@ui-kitten/components";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

const PhotoSection = ({ photoUri, setPhotoUri, latitude, setLatitude, longitude, setLongitude }) => {
  const handleTakePhoto = async () => {
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
      allowsEditing: true,
      aspect: [4, 3],
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

  return (
    <View>
      <Button onPress={handleTakePhoto} style={styles.button} accessoryLeft={(props) => <Icon {...props} name="camera-outline" />}>
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
    resizeMode: "contain",
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