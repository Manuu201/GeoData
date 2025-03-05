import React, { useState, useEffect, useCallback } from "react";
import { FlatList, StyleSheet, Image } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Layout, Card, Text, Button, Icon, Spinner } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PhotoEntity } from "../../database/database";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../navigation/types";

type NavigationProp = StackNavigationProp<RootStackParamList, "StructuralDataScreen">;

export default function PhotoSelectorScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation<NavigationProp>();
  const [photos, setPhotos] = useState<PhotoEntity[]>([]); // Estado para almacenar las fotos
  const [isLoading, setIsLoading] = useState(false); // Estado para manejar el estado de carga

  // Efecto que se ejecuta cada vez que la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      loadPhotos(); // Cargar las fotos al enfocar la pantalla
    }, [])
  );

  /**
   * Carga las fotos desde la base de datos.
   */
  const loadPhotos = async () => {
    setIsLoading(true); // Activar el estado de carga
    const photos = await db.getAllAsync<PhotoEntity>("SELECT * FROM photos;"); // Obtener todas las fotos
    setPhotos(photos); // Actualizar el estado con las fotos obtenidas
    setIsLoading(false); // Desactivar el estado de carga
  };

  /**
   * Maneja la selección de una foto.
   * 
   * @param {number} photoId - ID de la foto seleccionada.
   */
  const handlePhotoSelect = (photoId: number) => {
    navigation.navigate("StructuralDataScreen", { photoId }); // Navegar a la pantalla de datos estructurales con el ID de la foto
  };

  /**
   * Renderiza cada ítem de la lista de fotos.
   * 
   * @param {Object} item - Objeto que representa una foto.
   * @returns {JSX.Element} - Tarjeta con la foto y un botón para seleccionarla.
   */
  const renderPhotoItem = ({ item }: { item: PhotoEntity }) => (
    <Card style={styles.card} onPress={() => handlePhotoSelect(item.id)}>
      <Image source={{ uri: item.uri }} style={styles.image} /> {/* Mostrar la imagen */}
      <Text category="s1" style={styles.photoText}>
        Foto #{item.id} {/* Mostrar el ID de la foto */}
      </Text>
      <Button
        style={styles.selectButton}
        accessoryLeft={(props) => <Icon {...props} name="arrow-forward-outline" />}
        onPress={() => handlePhotoSelect(item.id)} // Botón para seleccionar la foto
      >
        Seleccionar
      </Button>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Layout style={styles.container} level="1">
        <Text category="h4" style={styles.title}>
          Selecciona una Foto {/* Título de la pantalla */}
        </Text>

        {isLoading ? ( // Mostrar un spinner si está cargando
          <Layout style={styles.spinnerContainer}>
            <Spinner size="large" />
          </Layout>
        ) : (
          // Mostrar la lista de fotos si no está cargando
          <FlatList
            data={photos}
            renderItem={renderPhotoItem}
            keyExtractor={(item) => item.id.toString()} // Extraer el ID como clave única
            contentContainerStyle={styles.photoList}
          />
        )}
      </Layout>
    </SafeAreaView>
  );
}

// Estilos del componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  photoList: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  image: {
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoText: {
    textAlign: "center",
    marginBottom: 8,
  },
  selectButton: {
    alignSelf: "center",
  },
});