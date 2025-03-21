import React, { useState, useCallback, useContext } from "react";
import { FlatList, StyleSheet, Image, Platform, Linking, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useSQLiteContext } from "expo-sqlite";
import { addPhotoAsync, deletePhotoAsync, type PhotoEntity } from "../../database/database";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Layout, Button, Card, Icon, Text, Modal, Spinner, TopNavigation, Divider, useTheme } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTerrain } from "../../context/TerrainContext"; // Importar el contexto del terreno

const ITEMS_PER_PAGE = 5;

export default function PhotosScreen() {
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const { terrainId } = useTerrain(); // Obtener el terreno seleccionado
  const [photos, setPhotos] = useState<PhotoEntity[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntity | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [filter, setFilter] = useState<"today" | "week" | "month" | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const theme = useTheme();

  // Efecto que se ejecuta cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      if (terrainId) {
        loadPhotos();
      } else {
        setPhotos([]); // Limpiar las fotos si no hay terreno seleccionado
      }
    }, [db, sortOrder, filter, currentPage, terrainId]),
  );

  /**
   * Carga las fotos desde la base de datos, aplicando los filtros y la paginación correspondientes.
   */
  async function loadPhotos() {
    if (!terrainId) return; // No cargar fotos si no hay terreno seleccionado

    setIsLoading(true);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const query = `SELECT * FROM photos WHERE terrainId = ? ORDER BY created_at ${sortOrder} LIMIT ? OFFSET ?`;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    const params = [terrainId, ITEMS_PER_PAGE, offset];

    const allPhotos = await db.getAllAsync<PhotoEntity>(query, params);

    const filteredPhotos = allPhotos.filter((photo) => {
      const createdAt = new Date(photo.created_at);
      switch (filter) {
        case "today":
          return createdAt >= today;
        case "week":
          return createdAt >= startOfWeek;
        case "month":
          return createdAt >= startOfMonth;
        default:
          return true;
      }
    });

    setPhotos(filteredPhotos);

    const countQuery = "SELECT COUNT(*) as total FROM photos WHERE terrainId = ?";
    const totalCount = await db.getFirstAsync<{ total: number }>(countQuery, [terrainId]);
    setTotalPages(Math.ceil(totalCount.total / ITEMS_PER_PAGE));

    setIsLoading(false);
  }

  /**
   * Permite al usuario tomar una foto usando la cámara del dispositivo.
   * La foto se guarda en la base de datos junto con la ubicación actual.
   */
  async function takePhoto() {
    if (!terrainId) {
      Alert.alert("Error", "Debes seleccionar un terreno antes de tomar una foto.");
      return;
    }

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

        await addPhotoAsync(db, terrainId, uri, latitude, longitude); // Asegúrate de pasar terrainId
        loadPhotos();
      } catch (error) {
        alert("No se pudo obtener la ubicación");
      }
    }
  }

  /**
   * Cambia el orden de clasificación de las fotos entre ascendente y descendente.
   */
  function toggleSortOrder() {
    setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    setCurrentPage(1); // Reinicia a la primera página al cambiar el orden
  }

  /**
   * Abre la ubicación de la foto en la aplicación de mapas del dispositivo.
   * 
   * @param {number} latitude - Latitud de la ubicación.
   * @param {number} longitude - Longitud de la ubicación.
   */
  function openInMaps(latitude: number, longitude: number) {
    const url =
      Platform.OS === "ios"
        ? `https://maps.apple.com/?q=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url);
  }

  /**
   * Elimina una foto de la base de datos.
   * 
   * @param {number} id - ID de la foto a eliminar.
   */
  async function deletePhoto(id: number) {
    await deletePhotoAsync(db, id);
    loadPhotos();
    setSelectedPhoto(null);
    setIsModalVisible(false);
  }

  /**
   * Renderiza un elemento de la lista de fotos.
   * 
   * @param {Object} item - El objeto de la foto a renderizar.
   * @returns {JSX.Element} - El componente de la tarjeta de la foto.
   */
  const renderPhotoItem = ({ item }: { item: PhotoEntity }) => (
    <Card
      style={styles(theme).card}
      onPress={() => {
        setSelectedPhoto(item);
        setIsModalVisible(true);
      }}
    >
      <Image source={{ uri: item.uri }} style={styles(theme).image} />
    </Card>
  );

  /**
   * Componente de botón de filtro.
   * 
   * @param {Object} props - Propiedades del botón de filtro.
   * @param {string} props.label - Etiqueta del botón.
   * @param {boolean} props.active - Indica si el filtro está activo.
   * @param {Function} props.onPress - Función que se ejecuta al presionar el botón.
   * @returns {JSX.Element} - El componente del botón de filtro.
   */
  const FilterButton = ({ label, active, onPress }) => (
    <Button
      appearance={active ? "filled" : "outline"}
      size="small"
      status="basic"
      onPress={onPress}
      style={{ marginRight: 8 }}
    >
      {label}
    </Button>
  );

  /**
   * Componente que contiene los botones de filtro.
   * 
   * @returns {JSX.Element} - El componente de los filtros.
   */
  const Filters = () => (
    <Layout style={{ flexDirection: "row", marginBottom: 16 }}>
      <FilterButton label="Hoy" active={filter === "today"} onPress={() => setFilter("today")} />
      <FilterButton label="Esta semana" active={filter === "week"} onPress={() => setFilter("week")} />
      <FilterButton label="Este mes" active={filter === "month"} onPress={() => setFilter("month")} />
      <FilterButton label="Todos" active={filter === "all"} onPress={() => setFilter("all")} />
    </Layout>
  );

  return (
    <SafeAreaView style={styles(theme).safeArea}>
      <TopNavigation title="Fotos Geológicas" alignment="center" />
      <Divider />
      <Layout style={styles(theme).container} level="1">
        <Filters />
        <Button
          onPress={toggleSortOrder}
          accessoryLeft={(props) => <Icon {...props} name="swap-outline" />}
          style={styles(theme).sortButton}
        >
          {`Ordenar por Fecha ${sortOrder === "ASC" ? "⬆" : "⬇"}`}
        </Button>

        {isLoading ? (
          <Layout style={styles(theme).spinnerContainer}>
            <Spinner size="large" />
          </Layout>
        ) : (
          <>
            {photos.length === 0 ? (
              <Layout style={styles(theme).emptyContainer}>
                <Icon name="image-outline" style={styles(theme).emptyIcon} fill={theme["text-hint-color"]} />
                <Text category="s1">Aún no tienes fotos. ¡Toma una nueva!</Text>
              </Layout>
            ) : (
              <FlatList
                data={photos}
                renderItem={renderPhotoItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles(theme).photoList}
              />
            )}

            <Layout style={styles(theme).paginationContainer} level="1">
              <Button
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={styles(theme).paginationButton}
                accessoryLeft={(props) => <Icon {...props} name="arrow-back-outline" />}
              >
                Anterior
              </Button>
              <Text>{`Página ${currentPage} de ${totalPages}`}</Text>
              <Button
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={styles(theme).paginationButton}
                accessoryRight={(props) => <Icon {...props} name="arrow-forward-outline" />}
              >
                Siguiente
              </Button>
            </Layout>

            <Button
              style={styles(theme).fab}
              accessoryLeft={(props) => <Icon {...props} name="camera-outline" />}
              onPress={takePhoto}
            />
          </>
        )}

        <Modal
          visible={isModalVisible}
          backdropStyle={styles(theme).backdrop}
          onBackdropPress={() => setIsModalVisible(false)}
        >
          {selectedPhoto && (
            <Card disabled>
              <Text category="h6" style={styles(theme).modalTitle}>
                Detalles de la Foto
              </Text>
              <Image source={{ uri: selectedPhoto.uri }} style={styles(theme).modalImage} />
              <Text
                style={styles(theme).modalText}
              >{`Lat: ${selectedPhoto.latitude.toFixed(6)}, Lon: ${selectedPhoto.longitude.toFixed(6)}`}</Text>
              <Layout style={styles(theme).modalActions}>
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
  );
}

/**
 * Estilos del componente.
 * 
 * @param {Object} theme - Tema de la aplicación.
 * @returns {Object} - Objeto de estilos.
 */
const styles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme["background-basic-color-1"],
    },
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme["background-basic-color-1"],
    },
    sortButton: {
      marginBottom: 16,
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
      backgroundColor: theme["background-basic-color-2"],
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
  });