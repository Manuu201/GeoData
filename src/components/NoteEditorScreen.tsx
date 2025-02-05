import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  Text,
  TextInput,
  IconButton,
  useTheme,
  FAB,
  Portal,
  Dialog,
  Button,
  Snackbar,
} from "react-native-paper";
import { useSQLiteContext } from "expo-sqlite";
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  addNoteAsync,
  updateNoteAsync,
  fetchNoteAttachmentsAsync,
  deleteNoteAttachmentAsync,
  fetchTablesAsync,
  fetchPhotosAsync,
  addNoteAttachmentAsync,
} from "../database/database";
import type { RootStackParamList } from "../navigation/types";
import type { TableEntity, PhotoEntity } from "../database/database";
import PhotoComponent from "../screens/PhotoComponent";
import TableComponent from "../screens/TableComponent";

type RouteProps = RouteProp<RootStackParamList, "NoteEditorScreen">;
type NavigationProp = StackNavigationProp<RootStackParamList, "NoteEditorScreen">;

export default function NoteEditorScreen() {
  const db = useSQLiteContext();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();

  const { note = { id: 0, title: "", content: "" } } = route.params || {};
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [photos, setPhotos] = useState<PhotoEntity[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (note.id > 0) {
        const noteAttachments = await fetchNoteAttachmentsAsync(db, note.id);
        setAttachments(noteAttachments);
      }
    };
    fetchAttachments();
    fetchTables();
    fetchPhotos();
  }, [note.id, db]);

  async function fetchTables() {
    const tables = await fetchTablesAsync(db);
    setTables(tables);
  }

  async function fetchPhotos() {
    const photos = await fetchPhotosAsync(db);
    setPhotos(photos);
  }

  const handleDeleteAttachment = useCallback(
    async (attachmentId: number) => {
      await deleteNoteAttachmentAsync(db, attachmentId);
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    },
    [db, setAttachments],
  );

  async function handleSaveNote() {
    if (title.trim() === "" || content.trim() === "") return;

    if (note.id > 0) {
      await updateNoteAsync(db, note.id, title, content);
    } else {
      await addNoteAsync(db, title, content);
    }

    setSnackbarVisible(true);

    if (route.params?.onSave) {
      route.params.onSave();
    }
  }

  const handleInsertTable = useCallback(
    async (table: TableEntity) => {
      await addNoteAttachmentAsync(db, note.id, 'table', table.id);
      setAttachments((prev) => [...prev, { id: table.id, type: 'table', table, key: `table-${table.id}` }]);
      setShowOptions(false);
    },
    [db, note.id],
  );

  const handleInsertPhoto = useCallback(
    async (photo: PhotoEntity) => {
      await addNoteAttachmentAsync(db, note.id, 'photo', photo.id);
      setAttachments((prev) => [...prev, { id: photo.id, type: 'photo', photo, key: `photo-${photo.id}` }]);
      setShowOptions(false);
    },
    [db, note.id],
  );

  const renderAttachment = useCallback(
    ({ item }: { item: any }) => {
      if (item.type === "photo") {
        return (
          <PhotoComponent photo={item.photo} onDelete={() => handleDeleteAttachment(item.id)} />
        );
      } else if (item.type === "table") {
        return (
          <TableComponent table={item.table} onDelete={() => handleDeleteAttachment(item.id)} />
        );
      }
      return null;
    },
    [handleDeleteAttachment],
  );

  const renderItem = useCallback(
    ({ item }: { item: TableEntity | PhotoEntity }) => (
      <Button
        mode="outlined"
        onPress={() =>
          "name" in item ? handleInsertTable(item as TableEntity) : handleInsertPhoto(item as PhotoEntity)
        }
        style={styles.insertButton}
        icon={"name" in item ? "table" : "image"}
      >
        {"name" in item ? item.name : `Foto ${item.id}`}
      </Button>
    ),
    [handleInsertTable, handleInsertPhoto],
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
            {attachments.map((item) => (
              <View key={`${item.type}-${item.id}`}>
                {renderAttachment({ item })}
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => setShowOptions(true)}
      />

      <Portal>
        <Dialog visible={showOptions} onDismiss={() => setShowOptions(false)}>
          <Dialog.Title>Insertar en la nota</Dialog.Title>
          <Dialog.Content>
            <FlatList
              data={[...tables, ...photos]}
              renderItem={renderItem}
              keyExtractor={(item) => ("name" in item ? `table-${item.id}` : `photo-${item.id}`)}
              numColumns={2}
              columnWrapperStyle={styles.insertButtonsRow}
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
  insertButton: {
    flex: 1,
    margin: 4,
  },
  insertButtonsRow: {
    justifyContent: "space-between",
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