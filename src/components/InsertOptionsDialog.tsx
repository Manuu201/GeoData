import React from "react";
import { Dialog, Button } from "react-native-paper";

interface InsertOptionsDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onInsertImage: () => void;
  onInsertTable: () => void;
}

export default function InsertOptionsDialog({
  visible,
  onDismiss,
  onInsertImage,
  onInsertTable,
}: InsertOptionsDialogProps) {
  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Insertar en la nota</Dialog.Title>
      <Dialog.Content>
        <Button
          mode="outlined"
          onPress={onInsertImage}
          style={{ margin: 8 }}
          icon="image"
        >
          Agregar Imagen
        </Button>
        <Button
          mode="outlined"
          onPress={onInsertTable}
          style={{ margin: 8 }}
          icon="table"
        >
          Agregar Tabla
        </Button>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cerrar</Button>
      </Dialog.Actions>
    </Dialog>
  );
}