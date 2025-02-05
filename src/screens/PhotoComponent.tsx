import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import { Button } from "react-native-paper";
import { PhotoEntity } from "../database/database";

interface PhotoComponentProps {
  photo: PhotoEntity;
  onDelete: () => void;
}

export default function PhotoComponent({ photo, onDelete }: PhotoComponentProps) {
  console.log("Photo data:", photo); // Verifica el contenido de la foto
  if (!photo || !photo.uri) {
    return <Text>No photo available</Text>;
  }
  return (
    <View style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.image} />
      <Button onPress={onDelete} style={styles.deleteButton}>
        Eliminar
      </Button>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  deleteButton: {
    marginTop: 8,
  },
});