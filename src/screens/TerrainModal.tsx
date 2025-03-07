import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Button, Icon, Text } from "@ui-kitten/components";

const TerrainModal = ({ isEdit, terrainName, onSave, onClose }) => {
  const [name, setName] = useState(terrainName || "");

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text category="h6" style={styles.modalTitle}>
          {isEdit ? "Editar Terreno" : "Crear Terreno"}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close-outline" fill="#000" style={styles.closeIcon} />
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Nombre del terreno"
        value={name}
        onChangeText={setName}
        style={styles.modalInput}
      />
      <Button onPress={() => onSave(name)} style={styles.modalButton}>
        {isEdit ? "Guardar Cambios" : "Crear"}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default TerrainModal;