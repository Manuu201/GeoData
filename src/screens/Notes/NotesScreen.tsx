import { useState, useCallback } from "react"
import { FlatList, StyleSheet, KeyboardAvoidingView, Platform, View, Animated } from "react-native"
import { Text, Card, FAB, useTheme, Snackbar, IconButton } from "react-native-paper"
import { useSQLiteContext } from "expo-sqlite"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { fetchNotesAsync, deleteNoteAsync, type NoteEntity } from "../../database/database"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../../navigation/types"
import { SafeAreaView } from "react-native-safe-area-context"
import React from "react"

type NavigationProp = StackNavigationProp<RootStackParamList, "NotesScreen">
const fadeAnim = new Animated.Value(0)
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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start()
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
          <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
            <FlatList
              data={notes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} onPress={() => openNoteEditor(item)}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.noteTitle, { color: theme.colors.onSurface }]}>{item.title}</Text>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => deleteNote(item.id)}
                        iconColor={theme.colors.error}
                      />
                    </View>
                    <Text numberOfLines={2} style={[styles.noteContent, { color: theme.colors.secondary }]}>{item.content}</Text>
                  </Card.Content>
                </Card>
              )}
              contentContainerStyle={styles.list}
            />
          </Animated.View>
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
  emptyText: { fontSize: 18, opacity: 0.6, textAlign: "center" },
  list: { paddingBottom: 80 },
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, elevation: 4, padding: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  noteTitle: { fontSize: 18, fontWeight: "bold" },
  noteContent: { fontSize: 14, opacity: 0.8, marginTop: 4 },
  fab: { position: "absolute", right: 16, bottom: 16 },
  snackbar: { position: "absolute", bottom: 60 },
})
