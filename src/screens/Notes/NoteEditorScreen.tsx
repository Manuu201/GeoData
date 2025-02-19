import { useState, useCallback } from "react"
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { Layout, Text, Input, Button, Icon, Modal, Card, useTheme } from "@ui-kitten/components"
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  addNoteAsync,
  updateNoteAsync,
  fetchTablesAsync,
  fetchPhotosAsync,
  type PhotoEntity,
  type TableEntity,
} from "../../database/database"
import PhotoComponent from "../../components/PhotoComponent"
import TableComponent from "../../components/TableComponent"
import type { RootStackParamList } from "../../navigation/types"
import { useSQLiteContext } from "expo-sqlite"
import InsertOptionsDialog from "../../components/InsertOptionsDialog"
import ImageSelectionDialog from "../../components/ImageSelectionDialog"
import TableSelectionDialog from "../../components/TableSelectionDialog"
import React from "react"

type RouteProps = RouteProp<RootStackParamList, "NoteEditorScreen">
type NavigationProp = StackNavigationProp<RootStackParamList, "NoteEditorScreen">

export default function NoteEditorScreen() {
  const db = useSQLiteContext()
  const route = useRoute<RouteProps>()
  const navigation = useNavigation<NavigationProp>()
  const theme = useTheme()

  const { note = { id: 0, title: "", content: "", photos: [], tables: [] } } = route.params || {}
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [photos, setPhotos] = useState<PhotoEntity[]>(Array.isArray(note.photos) ? note.photos : [])
  const [tables, setTables] = useState<TableEntity[]>(Array.isArray(note.tables) ? note.tables : [])
  const [showOptions, setShowOptions] = useState(false)
  const [showImageSelection, setShowImageSelection] = useState(false)
  const [showTableSelection, setShowTableSelection] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [availablePhotos, setAvailablePhotos] = useState<PhotoEntity[]>([])
  const [availableTables, setAvailableTables] = useState<TableEntity[]>([])

  const fetchTables = useCallback(async () => {
    const tables = await fetchTablesAsync(db)
    setAvailableTables(tables)
  }, [db])

  const fetchPhotos = useCallback(async () => {
    const photos = await fetchPhotosAsync(db)
    setAvailablePhotos(photos)
  }, [db])

  const handleDeletePhoto = useCallback(async (photoId: number) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
  }, [])

  const handleDeleteTable = useCallback(async (tableId: number) => {
    setTables((prev) => prev.filter((table) => table.id !== tableId))
  }, [])

  async function handleSaveNote() {
    if (title.trim() === "" || content.trim() === "") return

    if (note.id > 0) {
      await updateNoteAsync(db, note.id, title, content, photos, tables)
    } else {
      await addNoteAsync(db, title, content, photos, tables)
    }

    setSnackbarVisible(true)
    navigation.getParent()?.setOptions({ noteUpdated: true })

    if (route.params?.onSave) {
      route.params.onSave()
    }
  }

  const handleInsertTable = useCallback(async (table: TableEntity) => {
    setTables((prev) => [...prev, table])
    setShowTableSelection(false)
  }, [])

  const handleInsertPhoto = useCallback(async (photo: PhotoEntity) => {
    setPhotos((prev) => [...prev, photo])
    setShowImageSelection(false)
  }, [])

  const renderPhoto = useCallback(
    (photo: PhotoEntity) => (
      <PhotoComponent key={photo.id} photo={photo} onDelete={() => handleDeletePhoto(photo.id)} />
    ),
    [handleDeletePhoto],
  )

  const renderTable = useCallback(
    (table: TableEntity) => (
      <TableComponent key={table.id} table={table} onDelete={() => handleDeleteTable(table.id)} />
    ),
    [handleDeleteTable],
  )

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme["background-basic-color-1"] }]}>
      <Layout style={styles.container}>
        <Button
          appearance="ghost"
          accessoryLeft={(props) => <Icon {...props} name="save-outline" />}
          onPress={handleSaveNote}
          style={styles.saveButton}
        />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Input
              placeholder="Título"
              value={title}
              onChangeText={setTitle}
              style={styles.titleInput}
              textStyle={styles.titleText}
              maxLength={100}
            />
            <Input
              placeholder="Escribe tu nota aquí..."
              value={content}
              onChangeText={setContent}
              style={styles.contentInput}
              textStyle={styles.contentText}
              multiline
            />
            <View style={styles.attachmentsContainer}>
              {photos.map(renderPhoto)}
              {tables.map(renderTable)}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Button
          style={styles.fab}
          accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
          onPress={() => {
            fetchTables()
            fetchPhotos()
            setShowOptions(true)
          }}
        />

        <InsertOptionsDialog
          visible={showOptions}
          onDismiss={() => setShowOptions(false)}
          onInsertImage={() => {
            setShowOptions(false)
            setShowImageSelection(true)
          }}
          onInsertTable={() => {
            setShowOptions(false)
            setShowTableSelection(true)
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

        <Modal visible={snackbarVisible} onBackdropPress={() => setSnackbarVisible(false)} style={styles.snackbarModal}>
          <Card style={styles.snackbar}>
            <Text>Nota guardada exitosamente</Text>
          </Card>
        </Modal>
      </Layout>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  titleInput: {
    marginBottom: 16,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  contentInput: {
    flex: 1,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
  saveButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  snackbarModal: {
    width: "100%",
  },
  snackbar: {
    position: "absolute",
    bottom: 60,
    left: 16,
    right: 16,
    borderRadius: 8,
  },
  attachmentsContainer: {
    marginTop: 16,
  },
})

