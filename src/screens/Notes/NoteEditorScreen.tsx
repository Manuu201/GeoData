import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  TextInput,
  IconButton,
  useTheme,
  FAB,
  Portal,
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
  PhotoEntity,
  TableEntity,
} from "../../database/database";
import PhotoComponent from "../../components/PhotoComponent";
import TableComponent from "../../components/TableComponent";
import { RootStackParamList } from "../../navigation/types";
import { useSQLiteContext } from "expo-sqlite";
import InsertOptionsDialog from "../../components/InsertOptionsDialog";
import ImageSelectionDialog from "../../components/ImageSelectionDialog";
import TableSelectionDialog from "../../components/TableSelectionDialog";

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
  const [photos, setPhotos] = useState<PhotoEntity[]>(Array.isArray(note.photos) ? note.photos : [] );
  const [tables, setTables] = useState<TableEntity[]>(Array.isArray(note.tables) ? note.tables : [] );
  const [showOptions, setShowOptions] = useState(false);
  const [showImageSelection, setShowImageSelection] = useState(false);
  const [showTableSelection, setShowTableSelection] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [availablePhotos, setAvailablePhotos] = useState<PhotoEntity[]>([]);
  const [availableTables, setAvailableTables] = useState<TableEntity[]>([]);

  const fetchTables = useCallback(async () => {
    const tables = await fetchTablesAsync(db);
    setAvailableTables(tables);
  }, [db]);

  const fetchPhotos = useCallback(async () => {
    const photos = await fetchPhotosAsync(db);
    setAvailablePhotos(photos);
  }, [db]);

  const handleDeletePhoto = useCallback(
    async (photoId: number) => {
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    },
    [setPhotos]
  );

  const handleDeleteTable = useCallback(
    async (tableId: number) => {
      setTables((prev) => prev.filter((table) => table.id !== tableId));
    },
    [setTables]
  );

  async function handleSaveNote() {
    if (title.trim() === "" || content.trim() === "") return;

    if (note.id > 0) {
      await updateNoteAsync(db, note.id, title, content, photos, tables);
    } else {
      await addNoteAsync(db, title, content, photos, tables);
    }

    setSnackbarVisible(true);
    navigation.getParent()?.setOptions({ noteUpdated: true });

    if (route.params?.onSave) {
      route.params.onSave();
    }
  }

  const handleInsertTable = useCallback(
    async (table: TableEntity) => {
      setTables((prev) => [...prev, table]);
      setShowTableSelection(false);
    },
    [setTables]
  );

  const handleInsertPhoto = useCallback(
    async (photo: PhotoEntity) => {
      setPhotos((prev) => [...prev, photo]);
      setShowImageSelection(false);
    },
    [setPhotos]
  );

  const renderPhoto = useCallback(
    (photo: PhotoEntity) => (
      <PhotoComponent photo={photo} onDelete={() => handleDeletePhoto(photo.id)} />
    ),
    [handleDeletePhoto]
  );

  const renderTable = useCallback(
    (table: TableEntity) => (
      <TableComponent table={table} onDelete={() => handleDeleteTable(table.id)} />
    ),
    [handleDeleteTable]
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
            style={[styles.titleInput, { color: theme.colors.onSurface, borderColor: theme.colors.onSurfaceVariant }]}
            mode="outlined"
            maxLength={100}
            selectionColor={theme.colors.primary}
          />
          <TextInput
            placeholder="Escribe tu nota aquí..."
            value={content}
            onChangeText={setContent}
            style={styles.contentInput}
            mode="outlined"
            multiline
            selectionColor={theme.colors.primary}
          />
          <View style={styles.attachmentsContainer}>
            {photos.map((photo) => renderPhoto(photo))}
            {tables.map((table) => renderTable(table))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
        icon="plus"
        onPress={() => {
          fetchTables();
          fetchPhotos();
          setShowOptions(true);
        }}
      />

      <Portal>
        <InsertOptionsDialog
          visible={showOptions}
          onDismiss={() => setShowOptions(false)}
          onInsertImage={() => {
            setShowOptions(false);
            setShowImageSelection(true);
          }}
          onInsertTable={() => {
            setShowOptions(false);
            setShowTableSelection(true);
          }}
        />

        <ImageSelectionDialog
          visible={showImageSelection}
          onDismiss={() => setShowImageSelection(false)}
          photos={availablePhotos}
          onSelectImage={handleInsertPhoto}
        />

        <TableSelectionDialog
          visible={showTableSelection}
          onDismiss={() => setShowTableSelection(false)}
          tables={availableTables}
          onSelectTable={handleInsertTable}
        />
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
    padding: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 8,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    padding: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 4,
  },
  saveButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  snackbar: {
    position: "absolute",
    bottom: 60,
  },
  attachmentsContainer: {
    marginTop: 16,
  },
});
