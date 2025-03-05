import { useState } from "react";
import { FlatList, StyleSheet, View, Dimensions } from "react-native";
import { Button, Card, Input, Modal, Text, Icon, Select, SelectItem, IndexPath } from "@ui-kitten/components";
import type { TableEntity } from "../database/database";
import React from "react";

/**
 * Propiedades del componente TableSelectionDialog.
 * 
 * @property {boolean} visible - Indica si el diálogo es visible.
 * @property {Function} onDismiss - Función que se ejecuta al cerrar el diálogo.
 * @property {TableEntity[]} tables - Lista de tablas disponibles.
 * @property {Function} onSelectTable - Función que se ejecuta al seleccionar una tabla.
 */
interface TableSelectionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  tables: TableEntity[];
  onSelectTable: (table: TableEntity) => void;
}

/**
 * Diálogo para seleccionar una tabla de una lista.
 * 
 * @param {TableSelectionDialogProps} props - Propiedades del componente.
 * @returns {JSX.Element} - El componente renderizado.
 */
export default function TableSelectionDialog({ visible, onDismiss, tables, onSelectTable }: TableSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState(""); // Estado para la consulta de búsqueda
  const [selectedSortIndex, setSelectedSortIndex] = useState(new IndexPath(0)); // Estado para el índice de ordenación seleccionado

  const sortOptions = ["ID", "Nombre", "Fecha"]; // Opciones de ordenación
  const sortBy = sortOptions[selectedSortIndex.row]; // Criterio de ordenación seleccionado

  const screenWidth = Dimensions.get("window").width; // Ancho de la pantalla
  const cardWidth = screenWidth / 2 - 24; // Ancho de las tarjetas ajustado para márgenes

  /**
   * Filtra y ordena las tablas según la consulta de búsqueda y el criterio de ordenación.
   * 
   * @returns {TableEntity[]} - Lista de tablas filtradas y ordenadas.
   */
  const filteredTables = tables
    .filter((table) => table.name.toLowerCase().includes(searchQuery.toLowerCase())) // Filtrar por nombre
    .sort((a, b) => {
      if (sortBy === "ID") return a.id - b.id; // Ordenar por ID
      if (sortBy === "Nombre") return a.name.localeCompare(b.name); // Ordenar por nombre
      if (sortBy === "Fecha") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Ordenar por fecha
      return 0;
    });

  return (
    <Modal visible={visible} backdropStyle={styles.backdrop} onBackdropPress={onDismiss}>
      <Card disabled={true} style={styles.dialog}>
        {/* Título del diálogo */}
        <Text category="h5" style={styles.title}>
          Seleccionar Tabla
        </Text>

        {/* Campo de búsqueda */}
        <Input
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessoryLeft={(props) => <Icon {...props} name="search-outline" />}
          style={styles.searchInput}
        />

        {/* Selector de ordenación */}
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

        {/* Lista de tablas */}
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

        {/* Botón para cerrar el diálogo */}
        <Button onPress={onDismiss} style={styles.closeButton} status="danger">
          Cerrar
        </Button>
      </Card>
    </Modal>
  );
}

// Estilos del componente
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