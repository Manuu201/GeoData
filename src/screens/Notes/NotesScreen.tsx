import React, { useState, useCallback } from "react"
import { FlatList, StyleSheet, KeyboardAvoidingView, Platform, View, Animated } from "react-native"
import { Layout, Text, Card, Button, Icon, useTheme } from "@ui-kitten/components"
import { useSQLiteContext } from "expo-sqlite"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { fetchNotesAsync, deleteNoteAsync, type NoteEntity } from "../../database/database"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../../navigation/types"
import { SafeAreaView } from "react-native-safe-area-context"
import { Snackbar } from "react-native-paper"

type NavigationProp = StackNavigationProp<RootStackParamList, "NotesScreen">

export default function NotesScreen() {
  const db = useSQLiteContext()
  const navigation = useNavigation<NavigationProp>()
  const [notes, setNotes] = useState<NoteEntity[]>([])
  const theme = useTheme()
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const fadeAnim = React.useRef(new Animated.Value(0)).current

  useFocusEffect(
    useCallback(() => {
      fetchNotes()
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start()
    }, [])
  )

  async function fetchNotes() {
    setNotes(await fetchNotesAsync(db))
  }

  async function deleteNote(id: number) {
    await deleteNoteAsync(db, id)
    fetchNotes()
    showSnackbar("Nota eliminada")
  }

  function openNoteEditor(note?: NoteEntity) {
    if (!note) {
      showSnackbar("Nueva nota creada")
    }
    navigation.navigate("NoteEditorScreen", {
      note,
      refreshNotes: fetchNotes,
      onSave: () => showSnackbar("Nota guardada exitosamente"),
    })
  }

  function showSnackbar(message: string) {
    setSnackbarMessage(message)
    setSnackbarVisible(true)
    setTimeout(() => setSnackbarVisible(false), 3000) // Ocultar después de 3 segundos
  }

  const renderNoteCard = ({ item }: { item: NoteEntity }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Card style={styles.card} onPress={() => openNoteEditor(item)}>
        <View style={styles.cardHeader}>
          <Text category="h6" style={styles.noteTitle}>{item.title}</Text>
          <Button
            appearance="ghost"
            status="danger"
            accessoryLeft={(props) => <Icon {...props} name="trash-2-outline" />}
            onPress={() => deleteNote(item.id)}
          />
        </View>
        <Text category="p2" numberOfLines={2} style={styles.noteContent}>{item.content}</Text>
      </Card>
    </Animated.View>
  )

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme["background-basic-color-1"] }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Layout style={styles.container}>
          <Text category="h1" style={styles.title}>Notas Geológicas</Text>

          {notes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="file-text-outline" fill={theme["text-hint-color"]} style={styles.emptyIcon} />
              <Text category="s1" style={styles.emptyText}>Aún no tienes notas. ¡Crea una nueva!</Text>
            </View>
          ) : (
            <FlatList
              data={notes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderNoteCard}
              contentContainerStyle={styles.list}
            />
          )}
        </Layout>
      </KeyboardAvoidingView>

      <Button
        style={styles.fab}
        accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
        onPress={() => openNoteEditor()}
      >
        Nueva Nota
      </Button>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000} // Se oculta automáticamente en 3s
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  title: { marginBottom: 24, textAlign: "center", fontWeight: "bold" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyIcon: { width: 64, height: 64, marginBottom: 16 },
  emptyText: { textAlign: "center" },
  list: { paddingBottom: 80 },
  card: { marginBottom: 16, borderRadius: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  noteTitle: { flex: 1 },
  noteContent: { opacity: 0.7 },
  fab: { position: "absolute", right: 16, bottom: 16, borderRadius: 28 },
  snackbar: { position: "absolute", bottom: 80, left: 16, right: 16 },
})
