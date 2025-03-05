import React from "react";
import { StyleSheet } from "react-native";
import { Modal, Card, Button, Text, Icon } from "@ui-kitten/components";

interface InsertOptionsDialogProps {
  visible: boolean; // Indica si el diálogo está visible
  onDismiss: () => void; // Función para cerrar el diálogo
  onInsertImage: () => void; // Función para insertar una imagen
  onInsertTable: () => void; // Función para insertar una tabla
}

/**
 * Componente de diálogo que permite al usuario seleccionar entre insertar una imagen o una tabla.
 * 
 * @param {InsertOptionsDialogProps} props - Propiedades del componente.
 * @returns {JSX.Element} - El componente de diálogo de opciones de inserción.
 */
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
        {/* Título del diálogo */}
        <Text category="h6" style={styles.title}>
          Insertar en la nota
        </Text>

        {/* Botón para insertar una imagen */}
        <Button
          appearance="outline"
          accessoryLeft={(props) => <Icon {...props} name="image-outline" />}
          onPress={onInsertImage}
          style={styles.button}
        >
          Agregar Imagen
        </Button>

        {/* Botón para insertar una tabla */}
        <Button
          appearance="outline"
          accessoryLeft={(props) => <Icon {...props} name="grid-outline" />}
          onPress={onInsertTable}
          style={styles.button}
        >
          Agregar Tabla
        </Button>

        {/* Botón para cerrar el diálogo */}
        <Button onPress={onDismiss} status="danger" style={styles.closeButton}>
          Cerrar
        </Button>
      </Card>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fondo semitransparente
  },
  card: {
    padding: 20, // Espaciado interno
    width: 300, // Ancho fijo
    borderRadius: 10, // Bordes redondeados
  },
  title: {
    textAlign: "center", // Centrar el texto
    marginBottom: 10, // Margen inferior
  },
  button: {
    marginVertical: 5, // Margen vertical entre botones
  },
  closeButton: {
    marginTop: 10, // Margen superior para el botón de cerrar
  },
});