import React, { useState, useCallback, useEffect, useContext } from "react";
import { FlatList, View, StyleSheet, Alert } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { fetchReportsAsync, deleteReportAsync, type ReportEntity } from "../../database/database";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useFocusEffect } from "@react-navigation/native";
import {
  Button,
  Layout,
  Input,
  Text,
  Card,
  Modal,
  Icon,
  useTheme,
  TopNavigation,
  TopNavigationAction,
  Divider,
} from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInRight, FadeOutLeft, Layout as LayoutAnimation } from "react-native-reanimated";
import { Snackbar } from "react-native-paper";
import { useTerrain } from "../../context/TerrainContext"; // Importar el contexto del terreno

type ReportsScreenProps = NativeStackScreenProps<RootStackParamList, "ReportsScreen">;

/**
 * Pantalla que muestra una lista de reportes con funcionalidades de filtrado, ordenación y búsqueda.
 * Permite al usuario crear, editar y eliminar reportes.
 * 
 * @param {ReportsScreenProps} props - Propiedades de la pantalla.
 * @returns {JSX.Element} - El componente de la pantalla de reportes.
 */
const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [reports, setReports] = useState<ReportEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortByDate, setSortByDate] = useState(false);
  const [filter, setFilter] = useState<"today" | "week" | "month" | "all">("all");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<ReportEntity | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const db = useSQLiteContext();
  const { terrainId } = useTerrain(); // Obtener el terreno seleccionado
  const theme = useTheme();

  /**
   * Carga los reportes desde la base de datos.
   */
  const loadReports = useCallback(async () => {
    if (!terrainId) return; // No cargar reportes si no hay terreno seleccionado

    const fetchedReports = await fetchReportsAsync(db, terrainId);
    if (sortByDate) {
      fetchedReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    setReports(fetchedReports);
  }, [db, sortByDate, terrainId]);

  // Recargar reportes cuando la pantalla está enfocada
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports]),
  );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /**
   * Maneja la eliminación de un reporte.
   * 
   * @param {number} id - ID del reporte a eliminar.
   */
  const handleDeleteReport = async (id: number) => {
    await deleteReportAsync(db, id);
    setDeleteModalVisible(false);
    setReportToDelete(null);
    loadReports();
    setSnackbarMessage("Reporte eliminado exitosamente");
    setSnackbarVisible(true);
  };

  /**
   * Filtra los reportes según la búsqueda y el filtro seleccionado.
   * 
   * @returns {ReportEntity[]} - Lista de reportes filtrados.
   */
  const getFilteredReports = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return reports
      .filter((report) => {
        const createdAt = new Date(report.createdAt);
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
      .filter((report) => report.title.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const filteredReports = getFilteredReports();

  /**
   * Renderiza cada ítem de la lista de reportes.
   * 
   * @param {Object} item - El objeto del reporte a renderizar.
   * @returns {JSX.Element} - El componente de la tarjeta de reporte.
   */
  const renderReportItem = ({ item }: { item: ReportEntity }) => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} layout={LayoutAnimation.springify()}>
      <Card style={styles(theme).reportItem}>
        <Text category="h6">{item.title}</Text>
        <Text category="s1">Tipo: {item.type}</Text>
        <Text category="s1">Fecha: {new Date(item.createdAt).toLocaleDateString()}</Text>
        <View style={styles(theme).actions}>
          <Button size="small" status="info" onPress={() => navigation.navigate("ReportsEditorScreen", { report: item })}>
            Editar
          </Button>
          <Button
            size="small"
            status="danger"
            onPress={() => {
              setReportToDelete(item);
              setDeleteModalVisible(true);
            }}
          >
            Eliminar
          </Button>
        </View>
      </Card>
    </Animated.View>
  );

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

  /**
   * Estilos dinámicos del componente.
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
      reportItem: {
        marginBottom: 16,
        backgroundColor: theme["background-basic-color-2"],
      },
      actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
      },
      addButton: {
        position: "absolute",
        bottom: 16,
        right: 16,
        borderRadius: 28,
      },
      backdrop: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      },
      modalText: {
        marginBottom: 12,
        textAlign: "center",
      },
      modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
      },
      snackbar: {
        backgroundColor: theme["color-success-500"],
      },
    });

  return (
    <SafeAreaView style={styles(theme).safeArea}>
      <TopNavigation
        title="Descripción"
        alignment="center"
        accessoryRight={() => (
          <TopNavigationAction
            icon={AddIcon}
            onPress={() => {
              if (!terrainId) {
                Alert.alert("Error", "Debes seleccionar un terreno antes de crear una descripcion.");
                return;
              }
              navigation.navigate("ReportsEditorScreen");
            }}
          />
        )}
      />
      <Divider />
      <Layout style={styles(theme).container} level="1">
        <Input
          placeholder="Buscar descripcion..."
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
          data={filteredReports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReportItem}
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
            ¿Borrar reporte?
          </Text>
          <Text style={styles(theme).modalText}>¿Está seguro de que desea borrar "{reportToDelete?.title}"?</Text>
          <View style={styles(theme).modalActions}>
            <Button status="basic" onPress={() => setDeleteModalVisible(false)}>
              Cancelar
            </Button>
            <Button status="danger" onPress={() => reportToDelete && handleDeleteReport(reportToDelete.id)}>
              Borrar
            </Button>
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
    </SafeAreaView>
  );
};

export default ReportsScreen;