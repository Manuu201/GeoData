import React from "react";
import { Dialog, Button } from "react-native-paper";
import { FlatList } from "react-native";
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
  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Seleccionar Imagen</Dialog.Title>
      <Dialog.Content>
        <FlatList
          data={photos}
          renderItem={({ item }) => (
            <Button mode="outlined" onPress={() => onSelectImage(item)} style={{ margin: 8 }} icon="image">
              {`Foto ${item.id}`}
            </Button>
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