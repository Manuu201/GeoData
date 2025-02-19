import { useState } from "react";
import { FlatList, StyleSheet, View, Dimensions } from "react-native";
import { Button, Card, Input, Modal, Text, Icon, Select, SelectItem, IndexPath } from "@ui-kitten/components";
import type { TableEntity } from "../database/database";
import React from "react";

interface TableSelectionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  tables: TableEntity[];
  onSelectTable: (table: TableEntity) => void;
}

export default function TableSelectionDialog({ visible, onDismiss, tables, onSelectTable }: TableSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSortIndex, setSelectedSortIndex] = useState(new IndexPath(0));

  const sortOptions = ["ID", "Nombre", "Fecha"];
  const sortBy = sortOptions[selectedSortIndex.row];

  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth / 2 - 24; // Ajuste para márgenes

  // Filtrar y ordenar tablas
  const filteredTables = tables
    .filter((table) => table.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "ID") return a.id - b.id;
      if (sortBy === "Nombre") return a.name.localeCompare(b.name);
      if (sortBy === "Fecha") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  return (
    <Modal visible={visible} backdropStyle={styles.backdrop} onBackdropPress={onDismiss}>
      <Card disabled={true} style={styles.dialog}>
        <Text category="h5" style={styles.title}>
          Seleccionar Tabla
        </Text>
        <Input
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessoryLeft={(props) => <Icon {...props} name="search-outline" />}
          style={styles.searchInput}
        />
        <Select
          selectedIndex={selectedSortIndex}
          onSelect={(index) => setSelectedSortIndex(index as IndexPath)}
          style={styles.select}
          value={`Ordenar por: ${sortBy}`}
        >
          {sortOptions.map((option, index) => (
            <SelectItem key={index} title={option} />
          ))}
        </Select>
        <FlatList
          data={filteredTables}
          renderItem={({ item }) => (
            <Card style={[styles.card, { width: cardWidth }]} onPress={() => onSelectTable(item)} status="basic">
              <View style={styles.cardContent}>
                <Text category="s1" style={styles.tableName}>{item.name}</Text>
                <View style={styles.tableInfo}>
                  <Text appearance="hint" style={styles.infoText}>{`Filas: ${item.rows}`}</Text>
                  <Text appearance="hint" style={styles.infoText}>{`Columnas: ${item.columns}`}</Text>
                </View>
                <Text appearance="hint" style={styles.dateText}>{`Creada el: ${new Date(item.created_at).toLocaleDateString()}`}</Text>
              </View>
            </Card>
          )}
          keyExtractor={(item) => `table-${item.id}`}
          numColumns={2}
          contentContainerStyle={styles.list}
        />
        <Button onPress={onDismiss} style={styles.closeButton} status="danger">
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
  dialog: {
    width: "90%",
    padding: 20,
    borderRadius: 10,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
  },
  searchInput: {
    marginBottom: 10,
  },
  select: {
    marginBottom: 10,
  },
  list: {
    paddingBottom: 10,
  },
  card: {
    flex: 1,
    margin: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F7F9FC",
    elevation: 3,
    minWidth: 140, // Mínimo para que no se vean muy estrechas
    maxWidth: 180, // Máximo para que no se deformen
  },
  cardContent: {
    alignItems: "center",
  },
  tableName: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  tableInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
    color: "#888",
  },
  closeButton: {
    marginTop: 10,
    alignSelf: "center",
    width: "100%",
  },
});