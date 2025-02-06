import { useState, useCallback } from "react";
import { FlatList, StyleSheet, Image, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useSQLiteContext } from "expo-sqlite";
import { addPhotoAsync, fetchPhotosAsync, deletePhotoAsync, type PhotoEntity } from "../database/database";
import { Linking } from "react-native";
import { Card, FAB, Text, Button, Dialog, Portal, useTheme, Snackbar, IconButton, Menu } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from "@react-navigation/native";

export default function PhotosScreen() {
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const [photos, setPhotos] = useState<PhotoEntity[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntity | null>(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const theme = useTheme();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [startDate, endDate, currentPage])
  );

  const openMenu = () => setIsMenuVisible(true);
  const closeMenu = () => setIsMenuVisible(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (!startDate) {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  async function loadPhotos() {
    let query = 'SELECT * FROM photos WHERE 1=1';
    if (startDate) {
      query += ` AND DATE(created_at) >= '${startDate.toISOString().split('T')[0]}'`;
    }
    if (endDate) {
      query += ` AND DATE(created_at) <= '${endDate.toISOString().split('T')[0]}'`;
    }
    query += ` LIMIT ${itemsPerPage} OFFSET ${(currentPage - 1) * itemsPerPage}`;

    const filteredPhotos = await db.getAllAsync<PhotoEntity>(query);
    setPhotos(filteredPhotos);

    const countQuery = 'SELECT COUNT(*) as total FROM photos WHERE 1=1';
    const totalCount = await db.getFirstAsync<{ total: number }>(countQuery);
    setTotalPages(Math.ceil(totalCount.total / itemsPerPage));
  }

  async function takePhoto() {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== "granted") {
      alert("Se necesita permiso para usar la cámara");
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
      if (locationStatus !== "granted") {
        alert("Se necesita permiso de ubicación para guardar la foto");
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        await addPhotoAsync(db, uri, latitude, longitude);
        loadPhotos();
        setSnackbarMessage("Foto guardada exitosamente");
        setSnackbarVisible(true);
      } catch (error) {
        alert("No se pudo obtener la ubicación");
      }
    }
  }

  function openInMaps(latitude: number, longitude: number) {
    const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url);
  }

  async function deletePhoto(id: number) {
    await deletePhotoAsync(db, id);
    loadPhotos();
    setSelectedPhoto(null);
    setIsDialogVisible(false);
    setSnackbarMessage("Foto eliminada exitosamente");
    setSnackbarVisible(true);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.filterContainer}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Fotos Geológicas</Text>
        <Menu
          visible={isMenuVisible}
          onDismiss={closeMenu}
          anchor={
            <IconButton
              icon="filter"
              onPress={openMenu}
              iconColor={theme.colors.primary}
            />
          }
        >
          <Menu.Item onPress={() => setShowDatePicker(true)} title="Seleccionar Fecha Inicio" />
          <Menu.Item onPress={() => setShowDatePicker(true)} title="Seleccionar Fecha Fin" />
          <Menu.Item onPress={clearFilters} title="Limpiar Filtros" />
        </Menu>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

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
                setSelectedPhoto(item);
                setIsDialogVisible(true);
              }}
            >
              <Card.Cover source={{ uri: item.uri }} style={styles.image} />
            </Card>
          )}
        />
      )}

      <View style={styles.paginationContainer}>
        <Button onPress={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
          Anterior
        </Button>
        <Text>{`Página ${currentPage} de ${totalPages}`}</Text>
        <Button onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
          Siguiente
        </Button>
      </View>

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
                <Button
                    mode="contained"
                    onPress={() => navigation.navigate("OfflineMapScreen")}
                    style={{ margin: 10 }}
                  >
                    Ver Mapa Offline
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
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  title: { fontSize: 28, fontWeight: "bold", marginVertical: 16, textAlign: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#666", textAlign: "center" },
  list: { padding: 8 },
  card: { flex: 1, margin: 8, borderRadius: 12, elevation: 4 },
  image: { height: 150, borderRadius: 12, resizeMode: 'cover' },
  dialogImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16, resizeMode: 'contain' },
  coordinates: { textAlign: "center", marginTop: 8 },
  fab: { position: "absolute", right: 16, bottom: 16 },
  snackbar: { position: "absolute", bottom: 60 },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
});