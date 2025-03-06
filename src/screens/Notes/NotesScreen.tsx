import React, { useState, useCallback } from "react";
import { FlatList, StyleSheet, KeyboardAvoidingView, Platform, View, Animated, Alert } from "react-native";
import { Layout, Text, Card, Button, Icon, useTheme, Input, TopNavigation, TopNavigationAction, Divider, Modal } from "@ui-kitten/components";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { fetchNotesAsync, deleteNoteAsync, type NoteEntity } from "../../database/database";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { Snackbar } from "react-native-paper";
import * as Animatable from "react-native-animatable";
import { useTerrain } from "../../context/TerrainContext"; // Importar el contexto del terreno

type NavigationProp = StackNavigationProp<RootStackParamList, "NotesScreen">;

/**
 * Pantalla que muestra una lista de notas geológicas con funcionalidades de filtrado, ordenación y búsqueda.
 * Permite al usuario crear, editar y eliminar notas.
 * 
 * @returns {JSX.Element} - El componente de la pantalla de notas.
 */
export default function NotesScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation<NavigationProp>();
  const { terrainId } = useTerrain(); // Obtener el terreno seleccionado
  const [notes, setNotes] = useState<NoteEntity[]>([]);
  const theme = useTheme();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortByDate, setSortByDate] = useState(false);
  const [filter, setFilter] = useState<"today" | "week" | "month" | "all">("all");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<NoteEntity | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Efecto que se ejecuta cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      if (terrainId) {
        fetchNotes();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        setNotes([]); // Limpiar las notas si no hay terreno seleccionado
      }
    }, [terrainId])
  );

  /**
   * Obtiene las notas desde la base de datos y las almacena en el estado.
   */
  async function fetchNotes() {
    if (!terrainId) return; // No cargar notas si no hay terreno seleccionado

    const fetchedNotes = await fetchNotesAsync(db, terrainId); // Asegúrate de pasar terrainId
    if (sortByDate) {
      fetchedNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    setNotes(fetchedNotes);
  }

  /**
   * Elimina una nota de la base de datos.
   * 
   * @param {number} id - ID de la nota a eliminar.
   */
  async function deleteNote(id: number) {
    await deleteNoteAsync(db, id);
    fetchNotes();
    showSnackbar("Nota eliminada");
  }

  /**
   * Abre la pantalla de edición de notas.
   * 
   * @param {NoteEntity} [note] - La nota a editar (opcional).
   */
  function openNoteEditor(note?: NoteEntity) {
    if (!terrainId) {
      Alert.alert("Error", "Debes seleccionar un terreno antes de crear o editar una nota.");
      return;
    }

    if (!note) {
      showSnackbar("Nueva nota creada");
    }
    navigation.navigate("NoteEditorScreen", {
      note,
      refreshNotes: fetchNotes,
      onSave: () => showSnackbar("Nota guardada exitosamente"),
    });
  }

  /**
   * Muestra un mensaje en la Snackbar.
   * 
   * @param {string} message - El mensaje a mostrar.
   */
  function showSnackbar(message: string) {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }

  /**
   * Filtra y ordena las notas según los criterios seleccionados.
   * 
   * @returns {NoteEntity[]} - Lista de notas filtradas y ordenadas.
   */
  const getFilteredNotes = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return notes
      .filter((note) => {
        const createdAt = new Date(note.createdAt);
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
      .filter((note) => note.title.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const filteredNotes = getFilteredNotes();

  /**
   * Renderiza una tarjeta de nota.
   * 
   * @param {Object} item - El objeto de la nota a renderizar.
   * @returns {JSX.Element} - El componente de la tarjeta de nota.
   */
  const renderNoteCard = ({ item }: { item: NoteEntity }) => (
    <Animatable.View animation="fadeIn" duration={500}>
      <Card style={styles(theme).card} onPress={() => openNoteEditor(item)}>
        <View style={styles(theme).cardHeader}>
          <Text category="h6" style={styles(theme).noteTitle}>{item.title}</Text>
          <Button
            appearance="ghost"
            status="danger"
            accessoryLeft={(props) => <Icon {...props} name="trash-2-outline" />}
            onPress={() => {
              setNoteToDelete(item);
              setDeleteModalVisible(true);
            }}
          />
        </View>
        <Text category="p2" numberOfLines={2} style={styles(theme).noteContent}>{item.content}</Text>
      </Card>
    </Animatable.View>
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
      list: {
        paddingBottom: 80,
      },
      card: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: theme["background-basic-color-2"],
      },
      cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      },
      noteTitle: {
        flex: 1,
      },
      noteContent: {
        opacity: 0.7,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      },
      emptyText: {
        marginTop: 16,
        textAlign: "center",
        color: theme["text-hint-color"],
      },
      emptyIcon: {
        width: 48,
        height: 48,
      },
      fab: {
        position: "absolute",
        right: 16,
        bottom: 16,
        borderRadius: 28,
      },
      snackbar: {
        position: "absolute",
        bottom: 80,
        left: 16,
        right: 16,
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
        title="Notas Geológicas"
        alignment="center"
        accessoryRight={() => (
          <TopNavigationAction icon={AddIcon} onPress={() => openNoteEditor()} />
        )}
      />
      <Divider />
      <Layout style={styles(theme).container} level="1">
        <Input
          placeholder="Buscar notas..."
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
        {filteredNotes.length === 0 ? (
          <View style={styles(theme).emptyContainer}>
            <Icon name="file-text-outline" fill={theme["text-hint-color"]} style={styles(theme).emptyIcon} />
            <Text category="s1" style={styles(theme).emptyText}>Aún no tienes notas. ¡Crea una nueva!</Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderNoteCard}
            contentContainerStyle={styles(theme).list}
          />
        )}
      </Layout>

      <Modal
        visible={deleteModalVisible}
        backdropStyle={styles(theme).backdrop}
        onBackdropPress={() => setDeleteModalVisible(false)}
      >
        <Card disabled={true}>
          <Text category="h6" style={styles(theme).modalText}>
            ¿Borrar nota?
          </Text>
          <Text style={styles(theme).modalText}>¿Está seguro de que desea borrar "{noteToDelete?.title}"?</Text>
          <Layout style={styles(theme).modalButtonContainer}>
            <Button status="basic" onPress={() => setDeleteModalVisible(false)}>
              Cancelar
            </Button>
            <Button status="danger" onPress={() => noteToDelete && deleteNote(noteToDelete.id)}>
              Borrar
            </Button>
          </Layout>
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
}