import React, { useState, useCallback, memo, useContext } from "react";
import { FlatList, StyleSheet, Platform, KeyboardAvoidingView, View, Alert } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { TableEntity, fetchTablesAsync, addTableAsync, deleteTableAsync } from "../../database/database";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Text, Input, Button, Icon, Layout, useTheme, Modal, Spinner, TopNavigation, TopNavigationAction, Divider } from "@ui-kitten/components";
import type { RootStackParamList } from "../../navigation/types";
import { Snackbar } from "react-native-paper";
import { useTerrain } from "../../context/TerrainContext"; // Importar el contexto del terreno

const ITEMS_PER_PAGE = 5;

/**
 * Propiedades del componente `MemoizedTextInput`.
 */
interface MemoizedTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  error?: boolean;
}

/**
 * Componente de entrada de texto memoizado para mejorar el rendimiento.
 */
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

/**
 * Pantalla que muestra una lista de tablas geológicas con funcionalidades de filtrado, ordenación y paginación.
 * Permite al usuario agregar nuevas tablas, editar tablas existentes y eliminarlas.
 * 
 * @returns {JSX.Element} - El componente de la pantalla de tablas.
 */
export default function TableScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, "TableEditorScreen">>();
  const { terrainId } = useTerrain(); // Obtener el terreno seleccionado
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [newTableName, setNewTableName] = useState("");
  const [newTableRows, setNewTableRows] = useState("");
  const [newTableColumns, setNewTableColumns] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<{ field: string; message: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof predefinedTemplates | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortByDate, setSortByDate] = useState(false);
  const [filter, setFilter] = useState<"today" | "week" | "month" | "all">("all");
  const [page, setPage] = useState(0);
  const theme = useTheme();

  // Efecto que se ejecuta cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      if (terrainId) {
        fetchTables();
      } else {
        setTables([]); // Limpiar las tablas si no hay terreno seleccionado
      }
    }, [terrainId])
  );

  /**
   * Obtiene las tablas desde la base de datos y las almacena en el estado.
   */
  async function fetchTables() {
    if (!terrainId) return; // No cargar tablas si no hay terreno seleccionado

    const allTables = await fetchTablesAsync(db, terrainId);
    setTables(allTables);
    setPage(0);
  }

  /**
   * Filtra y ordena las tablas según los criterios seleccionados.
   * 
   * @returns {TableEntity[]} - Lista de tablas filtradas y ordenadas.
   */
  const getFilteredTables = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return tables
      .filter((table) => {
        const createdAt = new Date(table.created_at);
        switch (filter) {
          case "today":
            return createdAt >= today;
          case "week":
            return createdAt >= startOfWeek;
          case "month":
            return createdAt >= startOfMonth;
          default:
            return true;
        }
      })
      .filter((table) => table.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortByDate) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.name.localeCompare(b.name);
      });
  };

  const filteredTables = getFilteredTables();
  const totalPages = Math.ceil(filteredTables.length / ITEMS_PER_PAGE);
  const currentTables = filteredTables.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  /**
   * Agrega una nueva tabla a la base de datos.
   */
  const handleAddTable = async () => {
    if (!terrainId) {
      Alert.alert("Error", "Debes seleccionar un terreno antes de crear una tabla.");
      return;
    }

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

    await addTableAsync(db, terrainId, newTableName, rows, columns, data);
    setNewTableName("");
    setNewTableRows("");
    setNewTableColumns("");
    setSelectedTemplate(null);
    setIsDialogVisible(false);
    fetchTables();
    setSnackbarMessage("Tabla agregada exitosamente");
    setSnackbarVisible(true);
    setErrorMessage(null);
  };

  /**
   * Elimina una tabla de la base de datos.
   * 
   * @param {number} id - ID de la tabla a eliminar.
   */
  const handleDeleteTable = async (id: number) => {
    await deleteTableAsync(db, id);
    fetchTables();
    setSnackbarMessage("Tabla eliminada exitosamente");
    setSnackbarVisible(true);
  };

  /**
   * Plantillas predefinidas para la creación de tablas.
   */
  const predefinedTemplates = {
    "Roca Sedimentaria": {
      rows: 4,
      columns: 7,
      data: [
        ["Clastos", "Color", "Forma","Tamaño","Esfericidad","Redondeamiento","Porcentaje"],
        ["", "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
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
    },
    "Roca Piroclastica": {
      rows: 4,
      columns: 6,
      data: [
        ["Tipo Piroclastico", "Porcentaje", "Tamaño", "Forma", "Composicion", "Color"],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""]
      ]
    },
    "Roca Metamorfica": {
      rows: 4,
      columns: 6,
      data: [
        ["Minerales", "Forma", "Tamaño","Habito","Color","Porcentaje"],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
      ]
    }
  };

  /**
   * Selecciona una plantilla predefinida y llena los campos correspondientes.
   * 
   * @param {keyof typeof predefinedTemplates} templateName - Nombre de la plantilla seleccionada.
   */
  const handleTemplateSelection = (templateName: keyof typeof predefinedTemplates) => {
    const template = predefinedTemplates[templateName];
    setNewTableName(templateName);
    setNewTableRows(template.rows.toString());
    setNewTableColumns(template.columns.toString());
    setSelectedTemplate(templateName);
    setErrorMessage(null);
  };

  /**
   * Componente de botón de filtro.
   * 
   * @param {Object} props - Propiedades del botón de filtro.
   * @param {string} props.label - Etiqueta del botón.
   * @param {boolean} props.active - Indica si el filtro está activo.
   * @param {Function} props.onPress - Función que se ejecuta al presionar el botón.
   * @returns {JSX.Element} - El componente del botón de filtro.
   */
  const FilterButton = ({ label, active, onPress }) => (
    <Button
      appearance={active ? "filled" : "outline"}
      size="small"
      status="basic"
      onPress={onPress}
      style={{ marginRight: 8 }}
    >
      {label}
    </Button>
  );

  /**
   * Componente que contiene los botones de filtro.
   * 
   * @returns {JSX.Element} - El componente de los filtros.
   */
  const Filters = () => (
    <Layout style={{ flexDirection: "row", marginBottom: 16 }}>
      <FilterButton label="Hoy" active={filter === "today"} onPress={() => setFilter("today")} />
      <FilterButton label="Esta semana" active={filter === "week"} onPress={() => setFilter("week")} />
      <FilterButton label="Este mes" active={filter === "month"} onPress={() => setFilter("month")} />
      <FilterButton label="Todos" active={filter === "all"} onPress={() => setFilter("all")} />
    </Layout>
  );

  const SortIcon = (props) => <Icon {...props} name={sortByDate ? "calendar" : "calendar-outline"} />;
  const AddIcon = (props) => <Icon {...props} name="plus-outline" />;

  return (
    <SafeAreaView style={styles(theme).safeArea}>
      <TopNavigation
        title="Tablas Geológicas"
        alignment="center"
        accessoryRight={() => (
          <TopNavigationAction icon={AddIcon} onPress={() => setIsDialogVisible(true)} />
        )}
      />
      <Divider />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles(theme).container}>
        <Input
          placeholder="Buscar tablas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessoryLeft={(props) => <Icon {...props} name="search" />}
          style={styles(theme).searchInput}
        />
        <Filters />
        <Button
          appearance="ghost"
          status="basic"
          accessoryLeft={SortIcon}
          onPress={() => setSortByDate(!sortByDate)}
          style={styles(theme).sortButton}
        >
          {sortByDate ? "Ordenado por fecha" : "Ordenar por fecha"}
        </Button>

        <FlatList
          data={currentTables}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles(theme).listContent}
          renderItem={({ item }) => (
            <Card
              style={styles(theme).tableCard}
              onPress={() => navigation.navigate("TableEditorScreen", { table: item, onSave: fetchTables })}
            >
              <Text category="h6">{item.name}</Text>
              <Text category="s1" appearance="hint">
                {item.rows} Filas | {item.columns} Columnas
              </Text>
              <View style={styles(theme).cardActions}>
                <Button size="small" status="info" onPress={() => navigation.navigate("TableEditorScreen", { table: item, onSave: fetchTables })}>
                  Editar
                </Button>
                <Button size="small" status="danger" onPress={() => handleDeleteTable(item.id)}>
                  Eliminar
                </Button>
              </View>
            </Card>
          )}
        />

        <View style={styles(theme).pagination}>
          <Button appearance="ghost" disabled={page === 0} onPress={() => setPage(page - 1)} accessoryLeft={<Icon name="chevron-left" />} />
          <Text>{page + 1} / {totalPages || 1}</Text>
          <Button appearance="ghost" disabled={page >= totalPages - 1} onPress={() => setPage(page + 1)} accessoryLeft={<Icon name="chevron-right" />} />
        </View>

        <Modal visible={isDialogVisible} onBackdropPress={() => setIsDialogVisible(false)}>
          <Card>
            <Text category="h6">Agregar Tabla</Text>
            <View style={styles(theme).templateButtons}>
              <Button appearance="outline" onPress={() => handleTemplateSelection("Roca Sedimentaria")}>
                Usar Plantilla: Roca Sedimentaria
              </Button>
              <Button appearance="outline" onPress={() => handleTemplateSelection("Roca Ígnea")}>
                Usar Plantilla: Roca Ígnea
              </Button>
              <Button appearance="outline" onPress={() => handleTemplateSelection("Roca Piroclastica")}>
                Usar Plantilla: Roca Piroclastica
              </Button>
              <Button appearance="outline" onPress={() => handleTemplateSelection("Roca Metamorfica")}>
                Usar Plantilla: Roca Metamorfica
              </Button>

            </View>

            <MemoizedTextInput
              label="Nombre"
              value={newTableName}
              onChangeText={setNewTableName}
              error={errorMessage?.field === "name"}
            />
            {errorMessage?.field === "name" && <Text status="danger" style={styles(theme).errorText}>{errorMessage.message}</Text>}

            <MemoizedTextInput
              label="Filas"
              value={newTableRows}
              onChangeText={setNewTableRows}
              keyboardType="numeric"
              error={errorMessage?.field === "rows"}
            />
            {errorMessage?.field === "rows" && <Text status="danger" style={styles(theme).errorText}>{errorMessage.message}</Text>}

            <MemoizedTextInput
              label="Columnas"
              value={newTableColumns}
              onChangeText={setNewTableColumns}
              keyboardType="numeric"
              error={errorMessage?.field === "columns"}
            />
            {errorMessage?.field === "columns" && <Text status="danger" style={styles(theme).errorText}>{errorMessage.message}</Text>}

            <View style={styles(theme).cardActions}>
              <Button appearance="ghost" onPress={() => setIsDialogVisible(false)}>Cancelar</Button>
              <Button onPress={handleAddTable}>Agregar</Button>
            </View>
          </Card>
        </Modal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles(theme).snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Estilos del componente.
 * 
 * @param {Object} theme - Tema de la aplicación.
 * @returns {Object} - Objeto de estilos.
 */
const styles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme["background-basic-color-1"],
    },
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme["background-basic-color-1"],
    },
    searchInput: {
      marginBottom: 16,
    },
    sortButton: {
      marginBottom: 16,
    },
    listContent: {
      paddingBottom: 80,
    },
    tableCard: {
      marginBottom: 16,
      backgroundColor: theme["background-basic-color-2"],
    },
    cardActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
    },
    templateButtons: {
      flexDirection: "column",
      marginBottom: 10,
    },
    input: {
      marginBottom: 10,
    },
    errorText: {
      marginTop: 4,
    },
    snackbar: {
      position: "absolute",
      bottom: 80,
      left: 16,
      right: 16,
    },
  });