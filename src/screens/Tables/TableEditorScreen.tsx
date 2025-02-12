import { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  BackHandler,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { updateTableAsync } from "../../database/database";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  TextInput,
  Card,
  Snackbar,
  FAB,
  IconButton,
  useTheme,
  Button,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function TableEditorScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const route = useRoute();
  const { table } = route.params as { table: { id: number; name: string; data: string[][] } };
  const theme = useTheme();

  const [name, setName] = useState(table.name);
  const [data, setData] = useState<string[][]>(table.data);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [isModified, setIsModified] = useState(false); // Detecta cambios

  useEffect(() => {
    console.log("✏ Cargando datos de la tabla:", table);
  }, [table]);

  // Manejo del botón de retroceso en Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isModified) {
          Alert.alert(
            "Cambios no guardados",
            "Tienes cambios sin guardar. ¿Quieres salir sin guardar?",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Salir", onPress: () => navigation.goBack(), style: "destructive" },
            ]
          );
          return true;
        }
        return false;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [isModified])
  );

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setData((prevData) => {
      const newData = prevData.map((row) => [...row]);
      newData[rowIndex][colIndex] = value;
      return newData;
    });
    setIsModified(true);
  };

  async function handleSave() {
    console.log("📌 Guardando cambios en la tabla:", { name, data });
    await updateTableAsync(db, table.id, name, data.length, data[0]?.length || 0, data);

    setSnackbarVisible(true);
    setIsModified(false);
    setTimeout(() => navigation.goBack(), 1500);
  }

  // Preguntar al usuario si quiere salir sin guardar
  const handleGoBack = () => {
    if (isModified) {
      Alert.alert(
        "Cambios no guardados",
        "Tienes cambios sin guardar. ¿Quieres salir sin guardar?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", onPress: () => navigation.goBack(), style: "destructive" },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const addRow = () => {
    setData((prevData) => [...prevData, new Array(prevData[0].length).fill("")]);
    setIsModified(true);
  };

  const addColumn = () => {
    setData((prevData) => prevData.map((row) => [...row, ""]));
    setIsModified(true);
  };

  const confirmRemoveRow = (index: number) => {
    Alert.alert("Eliminar Fila", "¿Estás seguro de que deseas eliminar esta fila?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", onPress: () => removeRow(index), style: "destructive" },
    ]);
  };

  const confirmRemoveColumn = (index: number) => {
    Alert.alert("Eliminar Columna", "¿Estás seguro de que deseas eliminar esta columna?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", onPress: () => removeColumn(index), style: "destructive" },
    ]);
  };

  const removeRow = (index: number) => {
    if (data.length > 1) {
      setData((prevData) => prevData.filter((_, i) => i !== index));
      setIsModified(true);
    } else {
      Alert.alert("Error", "No se puede eliminar la última fila.");
    }
  };

  const removeColumn = (index: number) => {
    if (data[0].length > 1) {
      setData((prevData) => prevData.map((row) => row.filter((_, i) => i !== index)));
      setIsModified(true);
    } else {
      Alert.alert("Error", "No se puede eliminar la última columna.");
    }
  };

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
                onChangeText={(text) => {
                  setName(text);
                  setIsModified(true);
                }}
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
                        size={24}
                        onPress={() => confirmRemoveRow(rowIndex)}
                        style={styles.removeButton}
                      />
                    </View>
                  ))}
                  <View style={styles.row}>
                    {data[0].map((_, colIndex) => (
                      <IconButton
                        key={colIndex}
                        icon="close"
                        size={24}
                        onPress={() => confirmRemoveColumn(colIndex)}
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
  );
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
    alignItems: "center",
  },
  cell: {
    width: 120,
    height: 50,
    margin: 4,
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
});
