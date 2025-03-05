import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Button, Card, Icon, Text } from "@ui-kitten/components";
import { PhotoEntity } from "../database/database";

interface PhotoComponentProps {
  photo: PhotoEntity;
  onDelete: () => void;
}
/**
 * Componente que muestra una foto con un botón para eliminarla.
 * Si la foto no está disponible, muestra un mensaje de advertencia.
 * 
 * @param {PhotoComponentProps} props - Propiedades del componente.
 * @returns {JSX.Element} - El componente de la foto.
 */
export default function PhotoComponent({ photo, onDelete }: PhotoComponentProps) {
  console.log("Photo data:", photo); // Verifica el contenido de la foto

  if (!photo || !photo.uri) {
    return (
      <View style={styles.noPhotoContainer}>
        <Icon name="alert-circle-outline" fill="#8F9BB3" style={styles.noPhotoIcon} />
        <Text appearance="hint">No photo available</Text>
      </View>
    );
  }

  return (
    <Card style={styles.card}>
      <Image source={{ uri: photo.uri }} style={styles.image} />
      <Button
        status="danger"
        appearance="outline"
        accessoryLeft={(props) => <Icon {...props} name="trash-2-outline" />}
        onPress={onDelete}
        style={styles.deleteButton}
      >
        Eliminar
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  deleteButton: {
    marginTop: 10,
    alignSelf: "center",
  },
  noPhotoContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noPhotoIcon: {
    width: 32,
    height: 32,
    marginBottom: 5,
  },
});
