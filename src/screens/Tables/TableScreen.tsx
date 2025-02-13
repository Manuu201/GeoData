import React, { useState, useCallback, memo } from "react";
import { FlatList, StyleSheet, Platform, KeyboardAvoidingView, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { TableEntity, fetchTablesAsync, addTableAsync, deleteTableAsync } from "../../database/database";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Text, Input, Button, Icon, Layout, useTheme, Modal, Spinner } from "@ui-kitten/components";
import type { RootStackParamList } from "../../navigation/types";

const ITEMS_PER_PAGE = 5;

interface MemoizedTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  error?: boolean;
}

const MemoizedTextInput = memo<MemoizedTextInputProps>(({ label, value, onChangeText, keyboardType = "default", error = false }) => (
  <Input
    label={label}
    value={value}
    onChangeText={onChangeText}
    keyboardType={keyboardType}
    status={error ? "danger" : "basic"}
    style={styles.input}
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
    setErrorMessage(null);
  }

  async function handleDeleteTable(id: number) {
    await deleteTableAsync(db, id);
    fetchTables();
    setSnackbarMessage("Tabla eliminada exitosamente");
    setSnackbarVisible(true);
  }

  const totalPages = Math.ceil(sortedTables.length / ITEMS_PER_PAGE);
  const currentTables = sortedTables.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

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
        ["", "Minerales", "Fósiles", "Cemento", "Matriz"],
        ["Tipo", "", "", "", ""],
        ["Porcentaje", "", "", "", ""]
      ]
    }
  };

  const handleTemplateSelection = (templateName: keyof typeof predefinedTemplates) => {
    const template = predefinedTemplates[templateName];
    setNewTableName(templateName);
    setNewTableRows(template.rows.toString());
    setNewTableColumns(template.columns.toString());
    setSelectedTemplate(templateName);
    setErrorMessage(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme['background-basic-color-1'] }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <Text category="h1" style={styles.title}>Tablas Geológicas</Text>

        <View style={styles.sortContainer}>
          <Button appearance="ghost" onPress={() => toggleSort("name")}>
            {`Ordenar por Nombre ${sortBy === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}`}
          </Button>
          <Button appearance="ghost" onPress={() => toggleSort("date")}>
            {`Ordenar por Fecha ${sortBy === "date" ? (sortOrder === "asc" ? "↑" : "↓") : ""}`}
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
              <View>
                <Text category="h6" style={styles.tableName}>{item.name}</Text>
                <Text category="s1" style={styles.tableInfo}>
                  {item.rows} Filas | {item.columns} Columnas
                </Text>
              </View>
              <View style={styles.cardActions}>
                <Button appearance="outline" onPress={() => navigation.navigate("TableEditorScreen", { table: item, onSave: fetchTables })}>
                  Editar
                </Button>
                <Button appearance="outline" status="danger" onPress={() => handleDeleteTable(item.id)}>
                  Eliminar
                </Button>
              </View>
            </Card>
          )}
        />

        <View style={styles.pagination}>
          <Button appearance="ghost" disabled={page === 0} onPress={() => setPage(page - 1)} accessoryLeft={<Icon name="chevron-left" />} />
          <Text>{page + 1} / {totalPages || 1}</Text>
          <Button appearance="ghost" disabled={page >= totalPages - 1} onPress={() => setPage(page + 1)} accessoryLeft={<Icon name="chevron-right" />} />
        </View>

        <Modal visible={isDialogVisible} onBackdropPress={() => setIsDialogVisible(false)}>
          <Card>
            <View>
              <Text category="h6">Agregar Tabla</Text>
              <View style={styles.templateButtons}>
                <Button appearance="outline" onPress={() => handleTemplateSelection("Roca Sedimentaria")}>
                  Usar Plantilla: Roca Sedimentaria
                </Button>
                <Button appearance="outline" onPress={() => handleTemplateSelection("Roca Ígnea")}>
                  Usar Plantilla: Roca Ígnea
                </Button>
              </View>

              <MemoizedTextInput
                label="Nombre"
                value={newTableName}
                onChangeText={setNewTableName}
                error={errorMessage?.field === "name"}
              />
              {errorMessage?.field === "name" && <Text status="danger" style={styles.errorText}>{errorMessage.message}</Text>}

              <MemoizedTextInput
                label="Filas"
                value={newTableRows}
                onChangeText={setNewTableRows}
                keyboardType="numeric"
                error={errorMessage?.field === "rows"}
              />
              {errorMessage?.field === "rows" && <Text status="danger" style={styles.errorText}>{errorMessage.message}</Text>}

              <MemoizedTextInput
                label="Columnas"
                value={newTableColumns}
                onChangeText={setNewTableColumns}
                keyboardType="numeric"
                error={errorMessage?.field === "columns"}
              />
              {errorMessage?.field === "columns" && <Text status="danger" style={styles.errorText}>{errorMessage.message}</Text>}
            </View>
            <View style={styles.cardActions}>
              <Button appearance="ghost" onPress={() => setIsDialogVisible(false)}>Cancelar</Button>
              <Button onPress={handleAddTable}>Agregar</Button>
            </View>
          </Card>
        </Modal>

        <Button style={styles.fab} accessoryLeft={<Icon name="plus" />} onPress={() => setIsDialogVisible(true)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  title: { textAlign: "center", marginBottom: 16 },
  sortContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  list: { paddingBottom: 16 },
  tableCard: { marginBottom: 12 },
  tableName: { marginBottom: 4 },
  tableInfo: { color: "gray" },
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 10 },
  fab: { position: "absolute", right: 16, bottom: 16 },
  templateButtons: { flexDirection: "column", marginBottom: 10 },
  input: { marginBottom: 10 },
  errorText: { marginTop: 4 },
  cardActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
});
