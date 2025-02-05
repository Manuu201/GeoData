import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
} from "react-native";
import {
  TextInput,
  IconButton,
  useTheme,
  FAB,
  Portal,
  Dialog,
  Button,
  Snackbar,
} from "react-native-paper";
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  addNoteAsync,
  updateNoteAsync,
  fetchTablesAsync,
  fetchPhotosAsync,
  addPhotoAsync,
  addTableAsync,
  PhotoEntity,
  TableEntity,
} from "../database/database";
import PhotoComponent from "../screens/PhotoComponent";
import TableComponent from "../screens/TableComponent";
import { RootStackParamList } from "../navigation/types";
import { useSQLiteContext } from "expo-sqlite";

type RouteProps = RouteProp<RootStackParamList, "NoteEditorScreen">;
type NavigationProp = StackNavigationProp<RootStackParamList, "NoteEditorScreen">;

export default function NoteEditorScreen() {
  const db = useSQLiteContext();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();

  const { note = { id: 0, title: "", content: "", photos: [], tables: [] } } = route.params || {};
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [photos, setPhotos] = useState<PhotoEntity[]>(Array.isArray(note.photos) ? note.photos : []);
  const [tables, setTables] = useState<TableEntity[]>(Array.isArray(note.tables) ? note.tables : []);
  const [showOptions, setShowOptions] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Solo se carga cuando el usuario interactúa con el dialog, no al montar el componente
  const fetchTables = useCallback(async () => {
    const tables = await fetchTablesAsync(db);
    setTables(tables);
  }, [db]);

  const fetchPhotos = useCallback(async () => {
    const photos = await fetchPhotosAsync(db);
    setPhotos(photos);
  }, [db]);

  const handleDeletePhoto = useCallback(
    async (photoId: number) => {
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    },
    [setPhotos],
  );

  const handleDeleteTable = useCallback(
    async (tableId: number) => {
      setTables((prev) => prev.filter((table) => table.id !== tableId));
    },
    [setTables],
  );

  async function handleSaveNote() {
    if (title.trim() === "" || content.trim() === "") return;

    if (note.id > 0) {
      await updateNoteAsync(db, note.id, title, content, photos, tables);
    } else {
      await addNoteAsync(db, title, content, photos, tables);
    }

    setSnackbarVisible(true);

    if (route.params?.onSave) {
      route.params.onSave();
    }
  }

  const handleInsertTable = useCallback(
    async (table: TableEntity) => {
      setTables((prev) => [...prev, table]);
      setShowOptions(false);
    },
    [setTables],
  );

  const handleInsertPhoto = useCallback(
    async (photo: PhotoEntity) => {
      setPhotos((prev) => [...prev, photo]);
      setShowOptions(false);
    },
    [setPhotos],
  );

  const renderPhoto = useCallback(
    (photo: PhotoEntity) => (
      <PhotoComponent photo={photo} onDelete={() => handleDeletePhoto(photo.id)} />
    ),
    [handleDeletePhoto],
  );

  const renderTable = useCallback(
    (table: TableEntity) => (
      <TableComponent table={table} onDelete={() => handleDeleteTable(table.id)} />
    ),
    [handleDeleteTable],
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <IconButton icon="content-save" size={24} onPress={handleSaveNote} style={styles.saveButton} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.container}>
          <TextInput
            placeholder="Título"
            value={title}
            onChangeText={setTitle}
            style={[styles.titleInput, { color: theme.colors.primary }]}
            maxLength={100}
          />
          <TextInput
            placeholder="Escribe tu nota aquí..."
            value={content}
            onChangeText={setContent}
            style={styles.contentInput}
            multiline
          />
          <View style={styles.attachmentsContainer}>
            {photos.map((photo) => (
              <View key={`photo-${photo.id}`}>
                {renderPhoto(photo)}
              </View>
            ))}
            {tables.map((table) => (
              <View key={`table-${table.id}`}>
                {renderTable(table)}
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => {
          fetchTables(); // Cargar tablas cuando el usuario desea insertar una
          fetchPhotos(); // Cargar fotos cuando el usuario desea insertar una
          setShowOptions(true);
        }}
      />

      <Portal>
        <Dialog visible={showOptions} onDismiss={() => setShowOptions(false)}>
          <Dialog.Title>Insertar en la nota</Dialog.Title>
          <Dialog.Content>
            <FlatList
              data={[...tables, ...photos]}
              renderItem={({ item }) => (
                <Button
                  mode="outlined"
                  onPress={() =>
                    "name" in item
                      ? handleInsertTable(item as TableEntity)
                      : handleInsertPhoto(item as PhotoEntity)
                  }
                  style={styles.insertButton}
                  icon={"name" in item ? "table" : "image"}
                >
                  {"name" in item ? item.name : `Foto ${item.id}`}
                </Button>
              )}
              keyExtractor={(item) =>
                "name" in item ? `table-${item.id}` : `photo-${item.id}`
              }
              numColumns={2}
              columnWrapperStyle={styles.insertButton}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowOptions(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        Nota guardada exitosamente
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    padding: 0,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  saveButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  insertButton: {
    margin: 8,
  },
  snackbar: {
    position: "absolute",
    bottom: 60,
  },
  attachmentsContainer: {
    marginTop: 16,
  },
});
