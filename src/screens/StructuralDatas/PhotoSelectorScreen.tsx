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
  const [photos, setPhotos] = useState<PhotoEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );

  const loadPhotos = async () => {
    setIsLoading(true);
    const photos = await db.getAllAsync<PhotoEntity>("SELECT * FROM photos;");
    setPhotos(photos);
    setIsLoading(false);
  };

  const handlePhotoSelect = (photoId: number) => {
    navigation.navigate("StructuralDataScreen", { photoId }); // Navegación corregida
  };

  const renderPhotoItem = ({ item }: { item: PhotoEntity }) => (
    <Card style={styles.card} onPress={() => handlePhotoSelect(item.id)}>
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
          <Layout style={styles.spinnerContainer}>
            <Spinner size="large" />
          </Layout>
        ) : (
          <FlatList
            data={photos}
            renderItem={renderPhotoItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.photoList}
          />
        )}
      </Layout>
    </SafeAreaView>
  );
}

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