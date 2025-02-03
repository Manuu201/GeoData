import { useState, useCallback } from "react"
import { FlatList, StyleSheet, Platform, KeyboardAvoidingView } from "react-native"
import { useSQLiteContext } from "expo-sqlite"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import { type TableEntity, fetchTablesAsync, addTableAsync, deleteTableAsync } from "../database/database"
import { SafeAreaView } from "react-native-safe-area-context"
import { Card, Text, TextInput, Button, FAB, Dialog, Portal, useTheme, Snackbar } from "react-native-paper"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

type RootStackParamList = {
  TableEditorScreen: { table: TableEntity; onSave?: () => void }
}

export default function TableScreen() {
  const db = useSQLiteContext()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, "TableEditorScreen">>()
  const [tables, setTables] = useState<TableEntity[]>([])
  const [newTableName, setNewTableName] = useState("")
  const [newTableRows, setNewTableRows] = useState("")
  const [newTableColumns, setNewTableColumns] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDialogVisible, setIsDialogVisible] = useState(false)
  const theme = useTheme()
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")

  useFocusEffect(
    useCallback(() => {
      fetchTables()
    }, []),
  )

  async function fetchTables() {
    const allTables = await fetchTablesAsync(db)
    setTables(allTables)
  }

  async function handleAddTable() {
    const rows = Number.parseInt(newTableRows, 10)
    const columns = Number.parseInt(newTableColumns, 10)
    if (newTableName.trim() === "" || isNaN(rows) || isNaN(columns) || rows <= 0 || columns <= 0) {
      return
    }

    await addTableAsync(db, newTableName, rows, columns, Array(rows).fill(Array(columns).fill("")))
    setNewTableName("")
    setNewTableRows("")
    setNewTableColumns("")
    setIsDialogVisible(false)
    fetchTables()
    setSnackbarMessage("Tabla agregada exitosamente")
    setSnackbarVisible(true)
  }

  async function handleDeleteTable() {
    if (deleteId !== null) {
      await deleteTableAsync(db, deleteId)
      fetchTables()
    }
    setDeleteId(null)
    setSnackbarMessage("Tabla eliminada exitosamente")
    setSnackbarVisible(true)
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Tablas Geológicas</Text>

        <FlatList
          data={tables}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              style={styles.tableCard}
              onPress={() => navigation.navigate("TableEditorScreen", { table: item, onSave: fetchTables })}
            >
              <Card.Content>
                <Text style={styles.tableName}>{item.name}</Text>
                <Text style={styles.tableInfo}>
                  {item.rows} Filas | {item.columns} Columnas
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button
                  icon={({ size, color }) => <Icon name="pencil" size={size} color={color} />}
                  onPress={() => navigation.navigate("TableEditorScreen", { table: item, onSave: fetchTables })}
                >
                  Editar
                </Button>
                <Button
                  icon={({ size, color }) => <Icon name="delete" size={size} color={color} />}
                  onPress={() => setDeleteId(item.id)}
                  textColor={theme.colors.error}
                >
                  Eliminar
                </Button>
              </Card.Actions>
            </Card>
          )}
        />

        <Portal>
          <Dialog visible={isDialogVisible} onDismiss={() => setIsDialogVisible(false)}>
            <Dialog.Title>Nueva Tabla</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nombre de la tabla"
                value={newTableName}
                onChangeText={setNewTableName}
                style={styles.input}
              />
              <TextInput
                label="Filas"
                keyboardType="numeric"
                value={newTableRows}
                onChangeText={setNewTableRows}
                style={styles.input}
              />
              <TextInput
                label="Columnas"
                keyboardType="numeric"
                value={newTableColumns}
                onChangeText={setNewTableColumns}
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIsDialogVisible(false)}>Cancelar</Button>
              <Button onPress={handleAddTable}>Agregar</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={deleteId !== null} onDismiss={() => setDeleteId(null)}>
            <Dialog.Title>¿Eliminar tabla?</Dialog.Title>
            <Dialog.Content>
              <Text>Esta acción no se puede deshacer.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeleteId(null)}>Cancelar</Button>
              <Button onPress={handleDeleteTable} textColor={theme.colors.error}>
                Eliminar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={() => setIsDialogVisible(true)}
        />
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  list: {
    paddingBottom: 80,
  },
  tableCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  tableName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tableInfo: {
    fontSize: 14,
    color: "#666",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  snackbar: {
    position: "absolute",
    bottom: 60,
  },
})

