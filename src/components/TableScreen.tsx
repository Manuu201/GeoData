import { useState, useCallback } from "react";
import { FlatList, StyleSheet, Platform, KeyboardAvoidingView, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { TableEntity, fetchTablesAsync, addTableAsync, deleteTableAsync } from "../database/database";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Text, TextInput, Button, FAB, Dialog, Portal, useTheme, Snackbar, IconButton } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type RootStackParamList = {
  TableEditorScreen: { table: TableEntity; onSave?: () => void };
};

const ITEMS_PER_PAGE = 5; // Cantidad de tablas por página

export default function TableScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, "TableEditorScreen">>();
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [sortedTables, setSortedTables] = useState<TableEntity[]>([]);
  const [newTableName, setNewTableName] = useState("");
  const [newTableRows, setNewTableRows] = useState("");
  const [newTableColumns, setNewTableColumns] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      fetchTables();
    }, [])
  );

  async function fetchTables() {
    const allTables = await fetchTablesAsync(db);
    setTables(allTables);
    sortTables(allTables, sortBy, sortOrder);
    setPage(0);
  }

  function sortTables(data: TableEntity[], by: "name" | "date", order: "asc" | "desc") {
    const sorted = [...data].sort((a, b) => {
      if (by === "name") {
        return order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else {
        return order === "asc" ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at);
      }
    });

    setSortedTables(sorted);
  }

  function toggleSort(by: "name" | "date") {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortBy(by);
    setSortOrder(newOrder);
    sortTables(tables, by, newOrder);
  }

  async function handleAddTable() {
    const rows = Number.parseInt(newTableRows, 10);
    const columns = Number.parseInt(newTableColumns, 10);

    if (newTableName.trim() === "") {
      setErrorMessage("El nombre de la tabla no puede estar vacío.");
      return;
    }
    if (isNaN(rows) || isNaN(columns) || rows <= 0 || columns <= 0) {
      setErrorMessage("Filas y columnas deben ser números positivos.");
      return;
    }

    // Corrección: Genera correctamente la estructura de la tabla vacía
    const emptyData = Array.from({ length: rows }, () => Array(columns).fill(""));

    await addTableAsync(db, newTableName, rows, columns, emptyData);
    setNewTableName("");
    setNewTableRows("");
    setNewTableColumns("");
    setIsDialogVisible(false);
    fetchTables();
    setSnackbarMessage("Tabla agregada exitosamente");
    setSnackbarVisible(true);
  }

  async function handleDeleteTable(id: number) {
    await deleteTableAsync(db, id);
    fetchTables();
    setSnackbarMessage("Tabla eliminada exitosamente");
    setSnackbarVisible(true);
  }

  const totalPages = Math.ceil(sortedTables.length / ITEMS_PER_PAGE);
  const currentTables = sortedTables.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Tablas Geológicas</Text>

        {/* Botones de ordenamiento */}
        <View style={styles.sortContainer}>
          <Button onPress={() => toggleSort("name")}>
            Ordenar por Nombre {sortBy === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </Button>
          <Button onPress={() => toggleSort("date")}>
            Ordenar por Fecha {sortBy === "date" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </Button>
        </View>

        <FlatList
          data={currentTables}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              style={styles.tableCard}
              onPress={() => navigation.navigate("TableEditorScreen", { table: item, onSave: fetchTables })}
            >
              <Card.Content>
                <Text style={styles.tableName}>{item.name}</Text>
                <Text style={styles.tableInfo}>
                  {item.rows} Filas | {item.columns} Columnas
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => navigation.navigate("TableEditorScreen", { table: item, onSave: fetchTables })}>
                  Editar
                </Button>
                <Button onPress={() => handleDeleteTable(item.id)} textColor={theme.colors.error}>
                  Eliminar
                </Button>
              </Card.Actions>
            </Card>
          )}
        />

        {/* Paginación */}
        <View style={styles.pagination}>
          <IconButton icon="chevron-left" disabled={page === 0} onPress={() => setPage(page - 1)} />
          <Text>{page + 1} / {totalPages || 1}</Text>
          <IconButton icon="chevron-right" disabled={page >= totalPages - 1} onPress={() => setPage(page + 1)} />
        </View>

        {/* Diálogo para agregar tabla */}
        <Portal>
          <Dialog visible={isDialogVisible} onDismiss={() => setIsDialogVisible(false)}>
            <Dialog.Title>Agregar Tabla</Dialog.Title>
            <Dialog.Content>
              <TextInput label="Nombre" value={newTableName} onChangeText={setNewTableName} />
              <TextInput label="Filas" value={newTableRows} onChangeText={setNewTableRows} keyboardType="numeric" />
              <TextInput label="Columnas" value={newTableColumns} onChangeText={setNewTableColumns} keyboardType="numeric" />
              {errorMessage ? <Text style={{ color: "red" }}>{errorMessage}</Text> : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIsDialogVisible(false)}>Cancelar</Button>
              <Button onPress={handleAddTable}>Agregar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <FAB style={styles.fab} icon="plus" onPress={() => setIsDialogVisible(true)} />
        <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)}>{snackbarMessage}</Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  sortContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  list: { paddingBottom: 16 },
  tableCard: { marginBottom: 12 },
  tableName: { fontSize: 18, fontWeight: "bold" },
  tableInfo: { fontSize: 14, color: "gray" },
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 10 },
  fab: { position: "absolute", right: 16, bottom: 16 },
});
