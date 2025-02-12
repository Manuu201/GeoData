import { useState, useCallback, memo } from "react";
import { FlatList, StyleSheet, Platform, KeyboardAvoidingView, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { TableEntity, fetchTablesAsync, addTableAsync, deleteTableAsync } from "../../database/database";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Text, TextInput, Button, FAB, Dialog, Portal, useTheme, Snackbar, IconButton } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { RootStackParamList } from "../../navigation/types"; // Asegúrate de importar el tipo correcto

const ITEMS_PER_PAGE = 5; // Cantidad de tablas por página

// Memoized TextInput con tipado correcto
interface MemoizedTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  error?: boolean;
}

const MemoizedTextInput = memo<MemoizedTextInputProps>(({ label, value, onChangeText, keyboardType = "default", error = false }) => (
  <TextInput
    label={label}
    value={value}
    onChangeText={onChangeText}
    keyboardType={keyboardType}
    error={error} // Cambia el estilo si hay un error
    style={error ? styles.errorInput : undefined} // Aplica un estilo adicional si hay un error
  />
));

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
  const [errorMessage, setErrorMessage] = useState<{ field: string; message: string } | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof predefinedTemplates | null>(null);
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

    // Validaciones
    if (newTableName.trim() === "") {
      setErrorMessage({ field: "name", message: "El nombre de la tabla no puede estar vacío." });
      return;
    }
    if (isNaN(rows)) {
      setErrorMessage({ field: "rows", message: "Las filas deben ser un número válido." });
      return;
    }
    if (isNaN(columns)) {
      setErrorMessage({ field: "columns", message: "Las columnas deben ser un número válido." });
      return;
    }
    if (rows <= 0 || columns <= 0) {
      setErrorMessage({ field: rows <= 0 ? "rows" : "columns", message: "Filas y columnas deben ser números positivos." });
      return;
    }

    // Si se seleccionó una plantilla, usar sus datos
    const template = selectedTemplate ? predefinedTemplates[selectedTemplate] : null;
    const data = template ? template.data : Array.from({ length: rows }, () => Array(columns).fill(""));

    await addTableAsync(db, newTableName, rows, columns, data);
    setNewTableName("");
    setNewTableRows("");
    setNewTableColumns("");
    setSelectedTemplate(null);
    setIsDialogVisible(false);
    fetchTables();
    setSnackbarMessage("Tabla agregada exitosamente");
    setSnackbarVisible(true);
    setErrorMessage(null); // Limpiar mensajes de error
  }

  async function handleDeleteTable(id: number) {
    await deleteTableAsync(db, id);
    fetchTables();
    setSnackbarMessage("Tabla eliminada exitosamente");
    setSnackbarVisible(true);
  }

  const totalPages = Math.ceil(sortedTables.length / ITEMS_PER_PAGE);
  const currentTables = sortedTables.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  // Plantillas predefinidas
  // Plantillas predefinidas
const predefinedTemplates = {
  "Roca Sedimentaria": {
    rows: 5,
    columns: 5,
    data: [
      ["Minerales", "Forma", "Tamaño", "Color", "Porcentaje"],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""]
    ]
  },
  "Roca Ígnea": {
    rows: 3,
    columns: 4,
    data: [
      ["", "Minerales", "Fósiles", "Cemento", "Matriz"], // Primera fila: títulos de columnas
      ["Tipo", "", "", "", ""], // Segunda fila: Tipo
      ["Porcentaje", "", "", "", ""] // Tercera fila: Porcentaje
    ]
  }
};

  const handleTemplateSelection = (templateName: keyof typeof predefinedTemplates) => {
    const template = predefinedTemplates[templateName];
    setNewTableName(templateName);
    setNewTableRows(template.rows.toString());
    setNewTableColumns(template.columns.toString());
    setSelectedTemplate(templateName);
    setErrorMessage(null); // Limpiar mensajes de error al seleccionar una plantilla
  };

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
              {/* Selección de plantillas */}
              <View style={styles.templateButtons}>
                <Button onPress={() => handleTemplateSelection("Roca Sedimentaria")}>
                  Usar Plantilla: Roca Sedimentaria
                </Button>
                <Button onPress={() => handleTemplateSelection("Roca Ígnea")}>
                  Usar Plantilla: Roca Ígnea
                </Button>
              </View>

              <MemoizedTextInput
                label="Nombre"
                value={newTableName}
                onChangeText={setNewTableName}
                error={errorMessage?.field === "name"}
              />
              {errorMessage?.field === "name" && <Text style={styles.errorText}>{errorMessage.message}</Text>}

              <MemoizedTextInput
                label="Filas"
                value={newTableRows}
                onChangeText={setNewTableRows}
                keyboardType="numeric"
                error={errorMessage?.field === "rows"}
              />
              {errorMessage?.field === "rows" && <Text style={styles.errorText}>{errorMessage.message}</Text>}

              <MemoizedTextInput
                label="Columnas"
                value={newTableColumns}
                onChangeText={setNewTableColumns}
                keyboardType="numeric"
                error={errorMessage?.field === "columns"}
              />
              {errorMessage?.field === "columns" && <Text style={styles.errorText}>{errorMessage.message}</Text>}
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
  templateButtons: { flexDirection: "column", marginBottom: 10 },
  errorInput: { borderColor: "red", borderWidth: 1 }, // Estilo para resaltar errores
  errorText: { color: "red", fontSize: 12, marginTop: 4 }, // Estilo para mensajes de error
});