import React from "react";
import { StyleSheet } from "react-native";
import { Modal, Card, Button, Text, Icon } from "@ui-kitten/components";

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
    <Modal
      visible={visible}
      backdropStyle={styles.backdrop}
      onBackdropPress={onDismiss}
    >
      <Card disabled={true} style={styles.card}>
        <Text category="h6" style={styles.title}>
          Insertar en la nota
        </Text>
        <Button
          appearance="outline"
          accessoryLeft={(props) => <Icon {...props} name="image-outline" />}
          onPress={onInsertImage}
          style={styles.button}
        >
          Agregar Imagen
        </Button>
        <Button
          appearance="outline"
          accessoryLeft={(props) => <Icon {...props} name="grid-outline" />}
          onPress={onInsertTable}
          style={styles.button}
        >
          Agregar Tabla
        </Button>
        <Button onPress={onDismiss} status="danger" style={styles.closeButton}>
          Cerrar
        </Button>
      </Card>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  card: {
    padding: 20,
    width: 300,
    borderRadius: 10,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
  },
  button: {
    marginVertical: 5,
  },
  closeButton: {
    marginTop: 10,
  },
});
