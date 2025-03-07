import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Button, Icon, Text } from "@ui-kitten/components";

const DeleteConfirmationModal = ({ onConfirm, onClose }) => {
  return (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text category="h6" style={styles.modalTitle}>
          ¿Eliminar Terreno?
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close-outline" fill="#000" style={styles.closeIcon} />
        </TouchableOpacity>
      </View>
      <Text style={styles.modalText}>
        ¿Estás seguro de que deseas eliminar este terreno? Esta acción no se puede deshacer.
      </Text>
      <Button onPress={onConfirm} style={styles.modalButton} status="danger">
        Eliminar
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
  modalText: {
    marginBottom: 16,
    fontSize: 14,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default DeleteConfirmationModal;