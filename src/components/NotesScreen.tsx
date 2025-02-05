import { useState, useCallback } from "react"
import { FlatList, StyleSheet, KeyboardAvoidingView, Platform, View } from "react-native"
import { Text, Card, FAB, useTheme, Snackbar, IconButton } from "react-native-paper"
import { useSQLiteContext } from "expo-sqlite"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { fetchNotesAsync, deleteNoteAsync, type NoteEntity } from "../database/database"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../navigation/types"
import { SafeAreaView } from "react-native-safe-area-context"

type NavigationProp = StackNavigationProp<RootStackParamList, "NotesScreen">

export default function NotesScreen() {
  const db = useSQLiteContext()
  const navigation = useNavigation<NavigationProp>()
  const [notes, setNotes] = useState<NoteEntity[]>([])
  const theme = useTheme()
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")

  useFocusEffect(
    useCallback(() => {
      fetchNotes()
    }, []),
  )

  async function fetchNotes() {
    setNotes(await fetchNotesAsync(db))
  }

  async function deleteNote(id: number) {
    await deleteNoteAsync(db, id)
    fetchNotes()
    setSnackbarMessage("Nota eliminada")
    setSnackbarVisible(true)
  }

  function openNoteEditor(note?: NoteEntity) {
    if (!note) {
      setSnackbarMessage("Nueva nota creada")
      setSnackbarVisible(true)
    }
    navigation.navigate("NoteEditorScreen", {
      note,
      refreshNotes: fetchNotes,
      onSave: () => {
        setSnackbarMessage("Nota guardada exitosamente")
        setSnackbarVisible(true)
      },
    })
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Notas Geológicas</Text>

        {notes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aún no tienes notas. ¡Crea una nueva!</Text>
          </View>
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Card style={styles.card} onPress={() => openNoteEditor(item)}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.noteTitle}>{item.title}</Text>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => deleteNote(item.id)}
                    />
                  </View>
                  <Text numberOfLines={2} style={styles.noteContent}>{item.content}</Text>
                </Card.Content>
              </Card>
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </KeyboardAvoidingView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        label="Nueva Nota"
        onPress={() => openNoteEditor()}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  title: { fontSize: 28, fontWeight: "bold", marginVertical: 16, textAlign: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#666", textAlign: "center" },
  list: { paddingBottom: 80 },
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, elevation: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  noteTitle: { fontSize: 18, fontWeight: "bold" },
  noteContent: { fontSize: 14, color: "#666", marginTop: 4 },
  fab: { position: "absolute", right: 16, bottom: 16 },
  snackbar: { position: "absolute", bottom: 60 },
})
