import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, FlatList, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { Text, TextInput, IconButton, useTheme, FAB, Portal, Dialog, Button, Snackbar } from "react-native-paper"
import { useSQLiteContext } from "expo-sqlite"
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import { SafeAreaView } from "react-native-safe-area-context"

import {
  addNoteAsync,
  updateNoteAsync,
  fetchNoteAttachmentsAsync,
  deleteNoteAttachmentAsync,
  fetchTablesAsync,
  fetchPhotosAsync,
} from "../database/database"
import type { RootStackParamList } from "../navigation/types"
import type { TableEntity, PhotoEntity } from "../database/database"

type RouteProps = RouteProp<RootStackParamList, "NoteEditorScreen">
type NavigationProp = StackNavigationProp<RootStackParamList, "NoteEditorScreen">

export default function NoteEditorScreen() {
  const db = useSQLiteContext()
  const route = useRoute<RouteProps>()
  const navigation = useNavigation<NavigationProp>()
  const theme = useTheme()

  const { note = { id: 0, title: "", content: "" } } = route.params || {}
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [attachments, setAttachments] = useState<any[]>([])
  const [tables, setTables] = useState<TableEntity[]>([])
  const [photos, setPhotos] = useState<PhotoEntity[]>([])
  const [showOptions, setShowOptions] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)

  useEffect(() => {
    const fetchAttachments = async () => {
      if (note.id > 0) {
        const noteAttachments = await fetchNoteAttachmentsAsync(db, note.id)
        setAttachments(noteAttachments)
      }
    }
    fetchAttachments()
    fetchTables()
    fetchPhotos()
  }, [note.id, db])

  async function fetchTables() {
    const tables = await fetchTablesAsync(db)
    setTables(tables)
  }

  async function fetchPhotos() {
    const photos = await fetchPhotosAsync(db)
    setPhotos(photos)
  }

  const handleDeleteAttachment = useCallback(
    async (attachmentId: number) => {
      await deleteNoteAttachmentAsync(db, attachmentId)
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId))
    },
    [db, setAttachments],
  )

  async function handleSaveNote() {
    if (title.trim() === "" || content.trim() === "") return

    if (note.id > 0) {
      await updateNoteAsync(db, note.id, title, content)
    } else {
      await addNoteAsync(db, title, content)
    }

    setSnackbarVisible(true)

    // Llamar a la función onSave si existe
    if (route.params?.onSave) {
      route.params.onSave()
    }
  }

  function handleInsertTable(table: TableEntity) {
    setContent((prev) => prev + `\n\n[Tabla: ${table.name}]\n`)
    setShowOptions(false)
  }

  function handleInsertPhoto(photo: PhotoEntity) {
    setContent((prev) => prev + `\n\n[Foto: ${photo.id}]\n`)
    setShowOptions(false)
  }

  const renderAttachment = useCallback(
    ({ item }: { item: any }) => {
      if (item.type === "photo") {
        return (
          <View style={styles.attachmentItem}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <Text style={styles.attachmentText}>
              Coordenadas: Lat {item.latitude.toFixed(6)}, Lon {item.longitude.toFixed(6)}
            </Text>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteAttachment(item.id)}
              style={styles.deleteButton}
            />
          </View>
        )
      } else if (item.type === "table") {
        return (
          <View style={styles.attachmentItem}>
            <Text style={styles.attachmentTitle}>Tabla: {item.name}</Text>
            <ScrollView horizontal>
              <View>
                {item.data.map((row: string[], rowIndex: number) => (
                  <View key={rowIndex} style={styles.tableRow}>
                    {row.map((cell: string, cellIndex: number) => (
                      <Text key={cellIndex} style={styles.tableCell}>
                        {cell}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteAttachment(item.id)}
              style={styles.deleteButton}
            />
          </View>
        )
      }
      return null
    },
    [handleDeleteAttachment],
  )

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
    [],
  )

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
          {attachments.map((item) => renderAttachment({ item }))}
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
  )
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
  attachmentItem: {
    marginVertical: 8,
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  attachmentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  attachmentText: {
    fontSize: 14,
    marginBottom: 8,
  },
  image: {
    width: "100%",
    height: 200,
    marginBottom: 8,
    borderRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    padding: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    minWidth: 60,
    textAlign: "center",
  },
  deleteButton: {
    position: "absolute",
    top: 0,
    right: 0,
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
})

