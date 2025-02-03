import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native"
import { useSQLiteContext } from "expo-sqlite"
import { updateTableAsync } from "../database/database"
import { useNavigation, useRoute } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Text, TextInput, Card, Snackbar, FAB, IconButton, useTheme, Button } from "react-native-paper"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

export default function TableEditorScreen() {
  const db = useSQLiteContext()
  const navigation = useNavigation()
  const route = useRoute()
  const { table, onSave } = route.params as {
    table: { id: number; name: string; data: string[][] }
    onSave?: () => void
  }
  const theme = useTheme()

  const [name, setName] = useState(table.name)
  const [data, setData] = useState<string[][]>(table.data)
  const [snackbarVisible, setSnackbarVisible] = useState(false)

  useEffect(() => {
    console.log("✏ Cargando datos de la tabla:", table)
  }, [table]) // Added table to dependencies

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setData((prevData) => {
      const newData = prevData.map((row) => [...row])
      newData[rowIndex][colIndex] = value
      return newData
    })
  }

  async function handleSave() {
    console.log("📌 Guardando cambios en la tabla:", { name, data })
    await updateTableAsync(db, table.id, name, data.length, data[0]?.length || 0, data)

    if (onSave) onSave()
    setSnackbarVisible(true)
    setTimeout(() => navigation.goBack(), 1500)
  }

  const addRow = () => {
    setData((prevData) => [...prevData, new Array(prevData[0].length).fill("")])
  }

  const addColumn = () => {
    setData((prevData) => prevData.map((row) => [...row, ""]))
  }

  const removeRow = (index: number) => {
    if (data.length > 1) {
      setData((prevData) => prevData.filter((_, i) => i !== index))
    } else {
      Alert.alert("Error", "No se puede eliminar la última fila.")
    }
  }

  const removeColumn = (index: number) => {
    if (data[0].length > 1) {
      setData((prevData) => prevData.map((row) => row.filter((_, i) => i !== index)))
    } else {
      Alert.alert("Error", "No se puede eliminar la última columna.")
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>Editar Tabla</Text>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Nombre de la tabla"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <ScrollView horizontal>
                <View>
                  {data.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                      {row.map((cell, colIndex) => (
                        <TextInput
                          key={`${rowIndex}-${colIndex}`}
                          mode="outlined"
                          style={styles.cell}
                          value={cell}
                          onChangeText={(value) => handleCellChange(rowIndex, colIndex, value)}
                        />
                      ))}
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={() => removeRow(rowIndex)}
                        style={styles.removeButton}
                      />
                    </View>
                  ))}
                  <View style={styles.row}>
                    {data[0].map((_, colIndex) => (
                      <IconButton
                        key={colIndex}
                        icon="close"
                        size={20}
                        onPress={() => removeColumn(colIndex)}
                        style={styles.removeButton}
                      />
                    ))}
                  </View>
                </View>
              </ScrollView>
              <View style={styles.buttonContainer}>
                <Button mode="contained" onPress={addRow} style={styles.addButton}>
                  Agregar Fila
                </Button>
                <Button mode="contained" onPress={addColumn} style={styles.addButton}>
                  Agregar Columna
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>

        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon={(props) => <Icon name="content-save" {...props} />}
          onPress={handleSave}
        />

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={1500}
          style={{ backgroundColor: theme.colors.primary }}
        >
          ✅ Tabla guardada correctamente.
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
  scrollView: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  cell: {
    width: 100,
    margin: 4,
    padding: 8,
    textAlign: "center",
  },
  removeButton: {
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  addButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
})

