import { useState, useCallback } from "react"
import { FlatList, StyleSheet, Image, View } from "react-native"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import { useSQLiteContext } from "expo-sqlite"
import { addPhotoAsync, fetchPhotosAsync, deletePhotoAsync, type PhotoEntity } from "../database/database"
import { Linking } from "react-native"
import { Card, FAB, Text, Button, Dialog, Portal, useTheme, Snackbar, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import React from "react"

export default function PhotosScreen() {
  const db = useSQLiteContext()
  const [photos, setPhotos] = useState<PhotoEntity[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntity | null>(null)
  const [isDialogVisible, setIsDialogVisible] = useState(false)
  const theme = useTheme()
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")

  useFocusEffect(
    useCallback(() => {
      loadPhotos()
    }, []),
  )

  async function loadPhotos() {
    const allPhotos = await fetchPhotosAsync(db)
    setPhotos(allPhotos)
  }

  async function takePhoto() {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
    if (cameraStatus !== "granted") {
      alert("Se necesita permiso para usar la cámara")
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    })

    if (!result.canceled) {
      const uri = result.assets[0].uri

      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync()
      if (locationStatus !== "granted") {
        alert("Se necesita permiso de ubicación para guardar la foto")
        return
      }

      try {
        const location = await Location.getCurrentPositionAsync({})
        const { latitude, longitude } = location.coords

        await addPhotoAsync(db, uri, latitude, longitude)
        loadPhotos()
        setSnackbarMessage("Foto guardada exitosamente")
        setSnackbarVisible(true)
      } catch (error) {
        alert("No se pudo obtener la ubicación")
      }
    }
  }

  function openInMaps(latitude: number, longitude: number) {
    const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`
    Linking.openURL(url)
  }

  async function deletePhoto(id: number) {
    await deletePhotoAsync(db, id)
    loadPhotos()
    setSelectedPhoto(null)
    setIsDialogVisible(false)
    setSnackbarMessage("Foto eliminada exitosamente")
    setSnackbarVisible(true)
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>Fotos Geológicas</Text>

      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aún no tienes fotos. ¡Toma una nueva!</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              onPress={() => {
                setSelectedPhoto(item)
                setIsDialogVisible(true)
              }}
            >
              <Card.Cover source={{ uri: item.uri }} style={styles.image} />
            </Card>
          )}
        />
      )}

      <Portal>
        <Dialog visible={isDialogVisible} onDismiss={() => setIsDialogVisible(false)}>
          {selectedPhoto && (
            <>
              <Dialog.Title>Detalles de la Foto</Dialog.Title>
              <Dialog.Content>
                <Image source={{ uri: selectedPhoto.uri }} style={styles.dialogImage} />
                <Text style={styles.coordinates}>
                  Lat: {selectedPhoto.latitude.toFixed(6)}, Lon: {selectedPhoto.longitude.toFixed(6)}
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setIsDialogVisible(false)}>Cerrar</Button>
                <Button onPress={() => openInMaps(selectedPhoto.latitude, selectedPhoto.longitude)}>Ver en Mapa</Button>
                <Button onPress={() => deletePhoto(selectedPhoto.id)} textColor={theme.colors.error}>
                  Eliminar
                </Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>

      <FAB style={[styles.fab, { backgroundColor: theme.colors.primary }]} icon="camera" onPress={takePhoto} />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  title: { fontSize: 28, fontWeight: "bold", marginVertical: 16, textAlign: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#666", textAlign: "center" },
  list: { padding: 8 },
  card: { flex: 1, margin: 8, borderRadius: 12, elevation: 4 },
  image: { height: 150, borderRadius: 12 },
  dialogImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16 },
  coordinates: { textAlign: "center", marginTop: 8 },
  fab: { position: "absolute", right: 16, bottom: 16 },
  snackbar: { position: "absolute", bottom: 60 },
})
