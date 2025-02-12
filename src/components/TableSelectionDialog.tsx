import React, { useState } from "react";
import { Dialog, Button, Card, useTheme, TextInput, Menu } from "react-native-paper";
import { FlatList, StyleSheet, Text } from "react-native";
import { TableEntity } from "../database/database";

interface TableSelectionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  tables: TableEntity[];
  onSelectTable: (table: TableEntity) => void;
}

export default function TableSelectionDialog({
  visible,
  onDismiss,
  tables,
  onSelectTable,
}: TableSelectionDialogProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [menuVisible, setMenuVisible] = useState(false);

  // Filtrar y ordenar tablas
  const filteredTables = tables
    .filter((table) =>
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) // Buscar por nombre
    )
    .sort((a, b) => {
      if (sortBy === "id") return a.id - b.id;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "date") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Seleccionar Tabla</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Buscar por nombre"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button onPress={() => setMenuVisible(true)}>
              Ordenar por: {sortBy === "id" ? "ID" : sortBy === "name" ? "Nombre" : "Fecha"}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setSortBy("id"); setMenuVisible(false); }} title="ID" />
          <Menu.Item onPress={() => { setSortBy("name"); setMenuVisible(false); }} title="Nombre" />
          <Menu.Item onPress={() => { setSortBy("date"); setMenuVisible(false); }} title="Fecha" />
        </Menu>
        <FlatList
          data={filteredTables}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => onSelectTable(item)}>
              <Card.Content>
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                  {`${item.name}`}
                </Text>
                <Text style={[styles.details, { color: theme.colors.onSurface }]}>
                  {`Filas: ${item.rows}, Columnas: ${item.columns}`}
                </Text>
                <Text style={[styles.date, { color: theme.colors.onSurface }]}>
                  {`Creada el: ${new Date(item.created_at).toLocaleDateString()}`}
                </Text>
              </Card.Content>
            </Card>
          )}
          keyExtractor={(item) => `table-${item.id}`}
          numColumns={2}
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cerrar</Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  card: { margin: 8 },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  details: { fontSize: 14, marginBottom: 4 },
  date: { fontSize: 12, color: "#666" },
  searchInput: { marginBottom: 16 },
});