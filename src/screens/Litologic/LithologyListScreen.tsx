import React, { useState, useEffect, useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import {
  Button,
  Layout,
  Text,
  Card,
  Input,
  Icon,
  TopNavigation,
  TopNavigationAction,
  Modal,
  Divider,
  useTheme,
} from "@ui-kitten/components";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useSQLiteContext } from "expo-sqlite";
import { fetchColumnsAsync, deleteColumnAsync, type LithologyColumnEntity } from "../../database/database";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../navigation/types";
import * as Animatable from "react-native-animatable";
import { Snackbar } from "react-native-paper"; // Importamos Snackbar desde react-native-paper

type LithologyListScreenNavigationProp = StackNavigationProp<RootStackParamList, "LithologyListScreen">;

/**
 * Pantalla que muestra una lista de columnas litológicas con opciones de búsqueda, filtrado y eliminación.
 * 
 * @returns {JSX.Element} - El componente renderizado.
 */
const LithologyListScreen = () => {
  const navigation = useNavigation<LithologyListScreenNavigationProp>();
  const theme = useTheme();
  const db = useSQLiteContext();

  const [columns, setColumns] = useState<LithologyColumnEntity[]>([]); // Estado para almacenar las columnas
  const [searchQuery, setSearchQuery] = useState(""); // Estado para la consulta de búsqueda
  const [sortByDate, setSortByDate] = useState(false); // Estado para ordenar por fecha
  const [filter, setFilter] = useState<"today" | "week" | "month" | "all">("all"); // Estado para el filtro de fecha
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // Estado para controlar la visibilidad del modal de eliminación
  const [columnToDelete, setColumnToDelete] = useState<LithologyColumnEntity | null>(null); // Estado para almacenar la columna a eliminar
  const [snackbarVisible, setSnackbarVisible] = useState(false); // Estado para controlar la visibilidad del Snackbar
  const [snackbarMessage, setSnackbarMessage] = useState(""); // Mensaje del Snackbar

  /**
   * Carga las columnas desde la base de datos.
   */
  const loadColumns = useCallback(async () => {
    const fetchedColumns = await fetchColumnsAsync(db);
    if (sortByDate) {
      fetchedColumns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Ordenar por fecha si es necesario
    }
    setColumns(fetchedColumns); // Actualizar el estado con las columnas obtenidas
  }, [db, sortByDate]);

  // Recargar columnas cuando la pantalla está enfocada
  useFocusEffect(
    useCallback(() => {
      loadColumns();
    }, [loadColumns]),
  );

  useEffect(() => {
    loadColumns();
  }, [loadColumns]);

  /**
   * Maneja la eliminación de una columna.
   * 
   * @param {number} id - ID de la columna a eliminar.
   */
  const handleDelete = async (id: number) => {
    await deleteColumnAsync(db, id); // Eliminar la columna de la base de datos
    setDeleteModalVisible(false); // Ocultar el modal de eliminación
    setColumnToDelete(null); // Limpiar la columna seleccionada para eliminar
    loadColumns(); // Recargar las columnas
    setSnackbarMessage("Columna borrada exitosamente"); // Establecer el mensaje del Snackbar
    setSnackbarVisible(true); // Mostrar el Snackbar
  };

  /**
   * Filtra las columnas según la búsqueda y el filtro seleccionado.
   * 
   * @returns {LithologyColumnEntity[]} - Columnas filtradas.
   */
  const getFilteredColumns = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return columns
      .filter((column) => {
        const createdAt = new Date(column.createdAt);
        switch (filter) {
          case "today":
            return createdAt >= today; // Filtrar por hoy
          case "week":
            return createdAt >= startOfWeek; // Filtrar por esta semana
          case "month":
            return createdAt >= startOfMonth; // Filtrar por este mes
          default:
            return true; // No filtrar
        }
      })
      .filter((column) => column.name.toLowerCase().includes(searchQuery.toLowerCase())); // Filtrar por búsqueda
  };

  const filteredColumns = getFilteredColumns();

  /**
   * Renderiza cada ítem de la lista de columnas.
   * 
   * @param {Object} item - Objeto que representa una columna litológica.
   * @returns {JSX.Element} - Tarjeta con la información de la columna.
   */
  const renderItem = ({ item }: { item: LithologyColumnEntity }) => (
    <Animatable.View animation="fadeIn" duration={500}>
      <Card
        style={styles(theme).item}
        onPress={() => navigation.navigate("LithologyFormScreen", { columnId: item.id })}
      >
        <Text category="h6">{item.name}</Text>
        <Text category="s1" appearance="hint">
          Creado: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Button
          size="small"
          status="danger"
          style={styles(theme).deleteButton}
          onPress={() => {
            setColumnToDelete(item);
            setDeleteModalVisible(true);
          }}
        >
          Eliminar
        </Button>
      </Card>
    </Animatable.View>
  );

  /**
   * Componente de botón de filtro.
   * 
   * @param {Object} props - Propiedades del botón de filtro.
   * @param {string} props.label - Etiqueta del botón.
   * @param {boolean} props.active - Indica si el botón está activo.
   * @param {Function} props.onPress - Función que se ejecuta al presionar el botón.
   * @returns {JSX.Element} - Botón de filtro.
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
   * Componente de filtros.
   * 
   * @returns {JSX.Element} - Contenedor de botones de filtro.
   */
  const Filters = () => (
    <Layout style={{ flexDirection: "row", marginBottom: 16 }}>
      <FilterButton label="Hoy" active={filter === "today"} onPress={() => setFilter("today")} />
      <FilterButton label="Esta semana" active={filter === "week"} onPress={() => setFilter("week")} />
      <FilterButton label="Este mes" active={filter === "month"} onPress={() => setFilter("month")} />
      <FilterButton label="Todos" active={filter === "all"} onPress={() => setFilter("all")} />
    </Layout>
  );

  // Íconos
  const SortIcon = (props) => <Icon {...props} name={sortByDate ? "calendar" : "calendar-outline"} />;
  const AddIcon = (props) => <Icon {...props} name="plus-outline" />;

  // Estilos dinámicos
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
        paddingBottom: 16,
      },
      item: {
        marginBottom: 16,
        backgroundColor: theme["background-basic-color-2"],
      },
      deleteButton: {
        marginTop: 8,
        alignSelf: "flex-end",
      },
      backdrop: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      },
      modalText: {
        marginBottom: 12,
        textAlign: "center",
      },
      modalButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
      },
    });

  return (
    <SafeAreaView style={styles(theme).safeArea}>
      <TopNavigation
        title="Columnas Litológicas"
        alignment="center"
        accessoryRight={() => (
          <TopNavigationAction icon={AddIcon} onPress={() => navigation.navigate("CreateColumnScreen")} />
        )}
      />
      <Divider />
      <Layout style={styles(theme).container} level="1">
        <Input
          placeholder="Buscar columnas..."
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
          data={filteredColumns}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles(theme).listContent}
        />
      </Layout>

      <Modal
        visible={deleteModalVisible}
        backdropStyle={styles(theme).backdrop}
        onBackdropPress={() => setDeleteModalVisible(false)}
      >
        <Card disabled={true}>
          <Text category="h6" style={styles(theme).modalText}>
            ¿Borrar columna?
          </Text>
          <Text style={styles(theme).modalText}>¿Está seguro de que desea borrar "{columnToDelete?.name}"?</Text>
          <Layout style={styles(theme).modalButtonContainer}>
            <Button status="basic" onPress={() => setDeleteModalVisible(false)}>
              Cancelar
            </Button>
            <Button status="danger" onPress={() => columnToDelete && handleDelete(columnToDelete.id)}>
              Borrar
            </Button>
          </Layout>
        </Card>
      </Modal>

      {/* Snackbar para mostrar mensajes */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000} // Duración de 3 segundos
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

export default LithologyListScreen;