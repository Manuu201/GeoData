import React, { useState } from "react";
import { Dialog, Button, Card, useTheme, TextInput, Menu } from "react-native-paper";
import { FlatList, Image, StyleSheet, Text } from "react-native";
import { PhotoEntity } from "../database/database";

interface ImageSelectionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  photos: PhotoEntity[];
  onSelectImage: (photo: PhotoEntity) => void;
}

export default function ImageSelectionDialog({
  visible,
  onDismiss,
  photos,
  onSelectImage,
}: ImageSelectionDialogProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [menuVisible, setMenuVisible] = useState(false);

  // Filtrar y ordenar fotos
  const filteredPhotos = photos
    .filter((photo) =>
      photo.id.toString().includes(searchQuery.toLowerCase()) // Buscar por ID
    )
    .sort((a, b) => {
      if (sortBy === "id") return a.id - b.id;
      if (sortBy === "date") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Seleccionar Imagen</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Buscar por ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button onPress={() => setMenuVisible(true)}>
              Ordenar por: {sortBy === "id" ? "ID" : "Fecha"}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setSortBy("id"); setMenuVisible(false); }} title="ID" />
          <Menu.Item onPress={() => { setSortBy("date"); setMenuVisible(false); }} title="Fecha" />
        </Menu>
        <FlatList
          data={filteredPhotos}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => onSelectImage(item)}>
              <Card.Content>
                <Image source={{ uri: item.uri }} style={styles.image} />
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                  {`ID: ${item.id}`}
                </Text>
                <Text style={[styles.date, { color: theme.colors.onSurface }]}>
                  {`Fecha: ${new Date(item.created_at).toLocaleDateString()}`}
                </Text>
              </Card.Content>
            </Card>
          )}
          keyExtractor={(item) => `photo-${item.id}`}
          numColumns={2}
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cerrar</Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  card: { margin: 8 },
  image: { width: 100, height: 100, borderRadius: 8 },
  label: { textAlign: "center", marginTop: 8, fontWeight: "bold" },
  date: { textAlign: "center", marginTop: 4, fontSize: 12 },
  searchInput: { marginBottom: 16 },
});