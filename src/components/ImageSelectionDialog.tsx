import { useState } from "react";
import { IndexPath, Select, SelectItem } from "@ui-kitten/components";
import { Modal, Button, Card, Input, Text } from "@ui-kitten/components";
import { FlatList, Image, StyleSheet } from "react-native";
import type { PhotoEntity } from "../database/database";
import React from "react";

interface ImageSelectionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  photos: PhotoEntity[];
  onSelectImage: (photo: PhotoEntity) => void;
}

/**
 * Componente de diálogo para seleccionar una imagen de una lista de fotos.
 * Permite buscar, ordenar y seleccionar una foto.
 * 
 * @param {ImageSelectionDialogProps} props - Propiedades del componente.
 * @returns {JSX.Element} - El componente de diálogo de selección de imágenes.
 */
export default function ImageSelectionDialog({ visible, onDismiss, photos, onSelectImage }: ImageSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(new IndexPath(0));

  // Opciones de ordenamiento
  const sortOptions = ["ID", "Fecha"];
  const sortBy = sortOptions[selectedIndex.row];

  /**
   * Filtra y ordena las fotos según la búsqueda y el criterio de ordenamiento.
   * 
   * @returns {PhotoEntity[]} - Lista de fotos filtradas y ordenadas.
   */
  const filteredPhotos = photos
    .filter(
      (photo) => photo.id.toString().includes(searchQuery.toLowerCase()), // Buscar por ID
    )
    .sort((a, b) => {
      if (sortBy === "ID") return a.id - b.id;
      if (sortBy === "Fecha") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  return (
    <Modal visible={visible} backdropStyle={styles.backdrop} onBackdropPress={onDismiss}>
      <Card disabled>
        <Text category="h5" style={styles.title}>
          Seleccionar Imagen
        </Text>

        {/* Campo de búsqueda por ID */}
        <Input
          placeholder="Buscar por ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />

        {/* Selector de ordenamiento */}
        <Select
          selectedIndex={selectedIndex}
          onSelect={(index) => setSelectedIndex(index as IndexPath)}
          style={styles.select}
          placeholder="Ordenar por"
        >
          {sortOptions.map((title, index) => (
            <SelectItem key={index} title={title} />
          ))}
        </Select>

        {/* Lista de fotos */}
        <FlatList
          data={filteredPhotos}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => onSelectImage(item)}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              <Text style={styles.label}>{`ID: ${item.id}`}</Text>
              <Text style={styles.date}>{`Fecha: ${new Date(item.created_at).toLocaleDateString()}`}</Text>
            </Card>
          )}
          keyExtractor={(item) => `photo-${item.id}`}
          numColumns={2}
        />

        {/* Botón para cerrar el diálogo */}
        <Button style={styles.closeButton} onPress={onDismiss}>
          Cerrar
        </Button>
      </Card>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
  title: { textAlign: "center", marginBottom: 16 },
  searchInput: { marginBottom: 16 },
  select: { marginBottom: 16 },
  card: { margin: 8, padding: 10, alignItems: "center" },
  image: { width: 100, height: 100, borderRadius: 8 },
  label: { marginTop: 8, fontWeight: "bold" },
  date: { marginTop: 4, fontSize: 12 },
  closeButton: { marginTop: 16 },
});