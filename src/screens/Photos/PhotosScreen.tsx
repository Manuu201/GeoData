import { useState, useCallback } from "react"
import { FlatList, StyleSheet, Image, Platform, Linking } from "react-native"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import { useSQLiteContext } from "expo-sqlite"
import { addPhotoAsync, deletePhotoAsync, type PhotoEntity } from "../../database/database"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { Layout, Button, Card, Icon, Text, Modal, Spinner, Input, TopNavigation, Divider } from "@ui-kitten/components"
import { SafeAreaView } from "react-native-safe-area-context"
import React from "react"

export default function PhotosScreen() {
  const navigation = useNavigation()
  const db = useSQLiteContext()
  const [photos, setPhotos] = useState<PhotoEntity[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntity | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 5

  useFocusEffect(
    useCallback(() => {
      loadPhotos()
    }, [db]), //Corrected dependency array
  )

  async function loadPhotos() {
    setIsLoading(true)
    let query = "SELECT * FROM photos WHERE 1=1"
    if (startDate) {
      query += ` AND DATE(created_at) >= '${startDate}'`
    }
    if (endDate) {
      query += ` AND DATE(created_at) <= '${endDate}'`
    }
    query += ` LIMIT ${itemsPerPage} OFFSET ${(currentPage - 1) * itemsPerPage}`

    const filteredPhotos = await db.getAllAsync<PhotoEntity>(query)
    setPhotos(filteredPhotos)

    const countQuery = "SELECT COUNT(*) as total FROM photos WHERE 1=1"
    const totalCount = await db.getFirstAsync<{ total: number }>(countQuery)
    setTotalPages(Math.ceil(totalCount.total / itemsPerPage))

    setIsLoading(false)
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
      } catch (error) {
        alert("No se pudo obtener la ubicación")
      }
    }
  }

  function openInMaps(latitude: number, longitude: number) {
    const url =
      Platform.OS === "ios"
        ? `https://maps.apple.com/?q=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}`
    Linking.openURL(url)
  }

  async function deletePhoto(id: number) {
    await deletePhotoAsync(db, id)
    loadPhotos()
    setSelectedPhoto(null)
    setIsModalVisible(false)
  }

  const renderPhotoItem = ({ item }: { item: PhotoEntity }) => (
    <Card
      style={styles.card}
      onPress={() => {
        setSelectedPhoto(item)
        setIsModalVisible(true)
      }}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
    </Card>
  )

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopNavigation title="Fotos Geológicas" alignment="center" />
      <Divider />
      <Layout style={styles.container} level="1">
        <Layout style={styles.filterContainer} level="1">
          <Input
            placeholder="Fecha inicio (YYYY-MM-DD)"
            value={startDate}
            onChangeText={setStartDate}
            style={styles.dateInput}
            accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
          />
          <Input
            placeholder="Fecha fin (YYYY-MM-DD)"
            value={endDate}
            onChangeText={setEndDate}
            style={styles.dateInput}
            accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
          />
          <Button onPress={loadPhotos} accessoryLeft={(props) => <Icon {...props} name="search-outline" />}>
            Filtrar
          </Button>
        </Layout>

        {isLoading ? (
          <Layout style={styles.spinnerContainer}>
            <Spinner size="large" />
          </Layout>
        ) : (
          <>
            {photos.length === 0 ? (
              <Layout style={styles.emptyContainer}>
                <Icon name="image-outline" style={styles.emptyIcon} fill="#8F9BB3" />
                <Text category="s1">Aún no tienes fotos. ¡Toma una nueva!</Text>
              </Layout>
            ) : (
              <FlatList
                data={photos}
                renderItem={renderPhotoItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles.photoList}
              />
            )}

            <Layout style={styles.paginationContainer} level="1">
              <Button
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={styles.paginationButton}
                accessoryLeft={(props) => <Icon {...props} name="arrow-back-outline" />}
              >
                Anterior
              </Button>
              <Text>{`Página ${currentPage} de ${totalPages}`}</Text>
              <Button
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={styles.paginationButton}
                accessoryRight={(props) => <Icon {...props} name="arrow-forward-outline" />}
              >
                Siguiente
              </Button>
            </Layout>

            <Button
              style={styles.fab}
              accessoryLeft={(props) => <Icon {...props} name="camera-outline" />}
              onPress={takePhoto}
            />
          </>
        )}

        <Modal
          visible={isModalVisible}
          backdropStyle={styles.backdrop}
          onBackdropPress={() => setIsModalVisible(false)}
        >
          {selectedPhoto && (
            <Card disabled>
              <Text category="h6" style={styles.modalTitle}>
                Detalles de la Foto
              </Text>
              <Image source={{ uri: selectedPhoto.uri }} style={styles.modalImage} />
              <Text
                style={styles.modalText}
              >{`Lat: ${selectedPhoto.latitude.toFixed(6)}, Lon: ${selectedPhoto.longitude.toFixed(6)}`}</Text>
              <Layout style={styles.modalActions}>
                <Button onPress={() => setIsModalVisible(false)} status="basic">
                  Cerrar
                </Button>
                <Button onPress={() => openInMaps(selectedPhoto.latitude, selectedPhoto.longitude)} status="info">
                  Ver en Mapa
                </Button>
                <Button status="danger" onPress={() => deletePhoto(selectedPhoto.id)}>
                  Eliminar
                </Button>
              </Layout>
            </Card>
          )}
        </Modal>
      </Layout>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    marginRight: 8,
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  photoList: {
    paddingBottom: 80,
  },
  card: {
    flex: 1,
    margin: 8,
  },
  image: {
    height: 150,
    borderRadius: 8,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  paginationButton: {
    minWidth: 100,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  modalImage: {
    width: 250,
    height: 250,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: "center",
  },
  modalText: {
    marginBottom: 16,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
})

