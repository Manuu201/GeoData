import React, { useState, useEffect, useCallback } from "react";
import { FlatList, StyleSheet, Image, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Layout, Card, Text, Button, Icon, Spinner } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PhotoEntity } from "../../database/database";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../navigation/types";
import { useTerrain } from "../../context/TerrainContext";

type NavigationProp = StackNavigationProp<RootStackParamList, "StructuralDataScreen">;

export default function PhotoSelectorScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation<NavigationProp>();
  const { terrainId } = useTerrain();
  const [photos, setPhotos] = useState<PhotoEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log("Terrain ID:", terrainId); // Verifica el valor de terrainId
      if (terrainId) {
        loadPhotos();
      } else {
        setPhotos([]);
      }
    }, [terrainId])
  );

  const loadPhotos = async () => {
    if (!terrainId) return;

    setIsLoading(true);
    try {
      const photos = await db.getAllAsync<PhotoEntity>(
        "SELECT * FROM photos WHERE terrainId = ?;",
        [terrainId]
      );
      console.log("Fotos cargadas:", photos); // Verifica las fotos cargadas
      setPhotos(photos);
    } catch (error) {
      console.error("Error al cargar las fotos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = (photoId: number) => {
    navigation.navigate("StructuralDataScreen", { photoId });
  };

  const handleGoToPhotosScreen = () => {
    navigation.navigate("PhotosScreen");
  };

  const renderPhotoItem = ({ item }: { item: PhotoEntity }) => (
    <Card style={styles.card}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <Text category="s1" style={styles.photoText}>
        Foto #{item.id}
      </Text>
      <Button
        style={styles.selectButton}
        accessoryLeft={(props) => <Icon {...props} name="arrow-forward-outline" />}
        onPress={() => handlePhotoSelect(item.id)}
      >
        Seleccionar
      </Button>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Layout style={styles.container} level="1">
        <Text category="h4" style={styles.title}>
          Selecciona una Foto
        </Text>

        {isLoading ? (
          <View style={styles.spinnerContainer}>
            <Spinner size="large" />
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="image-outline" style={styles.emptyIcon} fill="#8F9BB3" />
            <Text category="s1" style={styles.emptyText}>
              Aún no tienes fotos. ¡Toma una nueva!
            </Text>
            <Button
              style={styles.goToPhotosButton}
              accessoryLeft={(props) => <Icon {...props} name="camera-outline" />}
              onPress={handleGoToPhotosScreen}
            >
              Ir a Fotos
            </Button>
          </View>
        ) : (
          <>
            <FlatList
              data={photos}
              renderItem={renderPhotoItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.photoList}
            />
            <Button
              style={styles.addPhotoButton}
              appearance="ghost"
              accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
              onPress={handleGoToPhotosScreen}
            >
              Agregar Foto
            </Button>
          </>
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
  emptyText: {
    marginBottom: 16,
    textAlign: "center",
  },
  goToPhotosButton: {
    marginTop: 16,
  },
  addPhotoButton: {
    marginTop: 16,
    alignSelf: "center",
  },
});