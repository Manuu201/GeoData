import { useState, useCallback } from "react"
import { FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native"
import { Text, Card, FAB, useTheme, Snackbar } from "react-native-paper"
import { useSQLiteContext } from "expo-sqlite"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { fetchNotesAsync, type NoteEntity } from "../database/database"
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
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => openNoteEditor(item)}>
              <Card.Content>
                <Text style={styles.noteTitle}>{item.title}</Text>
                <Text numberOfLines={2} style={styles.noteContent}>
                  {item.content}
                </Text>
              </Card.Content>
            </Card>
          )}
          contentContainerStyle={styles.list}
        />
      </KeyboardAvoidingView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
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
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 24,
    textAlign: "center",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: "#666",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  list: {
    paddingBottom: 80,
  },
  snackbar: {
    position: "absolute",
    bottom: 60,
  },
})
