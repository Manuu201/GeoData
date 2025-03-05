import React, { useState, useEffect, useCallback } from "react";
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
import { Button, Card, Icon, Input, Layout, Text, useTheme, Modal } from "@ui-kitten/components";
import { EvaIconsPack } from '@ui-kitten/eva-icons';

/**
 * Pantalla de edición de una tabla geológica.
 * Permite al usuario modificar el nombre de la tabla, editar celdas, agregar/eliminar filas y columnas,
 * y guardar los cambios en la base de datos.
 * 
 * @returns {JSX.Element} - El componente de la pantalla de edición de tablas.
 */
export default function TableEditorScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const route = useRoute();
  const { table } = route.params as { table: { id: number; name: string; data: string[][] } };
  const theme = useTheme();

  const [name, setName] = useState(table.name);
  const [data, setData] = useState<string[][]>(table.data);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Efecto para registrar la carga de datos de la tabla
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

  /**
   * Maneja el cambio de valor en una celda de la tabla.
   * 
   * @param {number} rowIndex - Índice de la fila.
   * @param {number} colIndex - Índice de la columna.
   * @param {string} value - Nuevo valor de la celda.
   */
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setData((prevData) => {
      const newData = prevData.map((row) => [...row]);
      newData[rowIndex][colIndex] = value;
      return newData;
    });
    setIsModified(true);
  };

  /**
   * Guarda los cambios realizados en la tabla en la base de datos.
   */
  async function handleSave() {
    console.log("📌 Guardando cambios en la tabla:", { name, data });
    await updateTableAsync(db, table.id, name, data.length, data[0]?.length || 0, data);

    setSnackbarVisible(true);
    setIsModified(false);
    setTimeout(() => navigation.goBack(), 1500);
  }

  /**
   * Maneja la navegación hacia atrás, mostrando una alerta si hay cambios sin guardar.
   */
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

  /**
   * Agrega una nueva fila a la tabla.
   */
  const addRow = () => {
    setData((prevData) => [...prevData, new Array(prevData[0].length).fill("")]);
    setIsModified(true);
  };

  /**
   * Agrega una nueva columna a la tabla.
   */
  const addColumn = () => {
    setData((prevData) => prevData.map((row) => [...row, ""]));
    setIsModified(true);
  };

  /**
   * Muestra una alerta de confirmación para eliminar una fila.
   * 
   * @param {number} index - Índice de la fila a eliminar.
   */
  const confirmRemoveRow = (index: number) => {
    Alert.alert("Eliminar Fila", "¿Estás seguro de que deseas eliminar esta fila?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", onPress: () => removeRow(index), style: "destructive" },
    ]);
  };

  /**
   * Muestra una alerta de confirmación para eliminar una columna.
   * 
   * @param {number} index - Índice de la columna a eliminar.
   */
  const confirmRemoveColumn = (index: number) => {
    Alert.alert("Eliminar Columna", "¿Estás seguro de que deseas eliminar esta columna?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", onPress: () => removeColumn(index), style: "destructive" },
    ]);
  };

  /**
   * Elimina una fila de la tabla.
   * 
   * @param {number} index - Índice de la fila a eliminar.
   */
  const removeRow = (index: number) => {
    if (data.length > 1) {
      setData((prevData) => prevData.filter((_, i) => i !== index));
      setIsModified(true);
    } else {
      Alert.alert("Error", "No se puede eliminar la última fila.");
    }
  };

  /**
   * Elimina una columna de la tabla.
   * 
   * @param {number} index - Índice de la columna a eliminar.
   */
  const removeColumn = (index: number) => {
    if (data[0].length > 1) {
      setData((prevData) => prevData.map((row) => row.filter((_, i) => i !== index)));
      setIsModified(true);
    } else {
      Alert.alert("Error", "No se puede eliminar la última columna.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme['background-basic-color-1'] }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text category="h1" style={styles.title}>Editar Tabla</Text>

          <Card style={styles.card}>
            <Input
              label="Nombre de la tabla"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setIsModified(true);
              }}
              style={styles.input}
            />
          </Card>

          <Card style={styles.card}>
            <ScrollView horizontal>
              <View>
                {data.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.row}>
                    {row.map((cell, colIndex) => (
                      <Input
                        key={`${rowIndex}-${colIndex}`}
                        style={styles.cell}
                        value={cell}
                        onChangeText={(value) => handleCellChange(rowIndex, colIndex, value)}
                      />
                    ))}
                    <Button
                      appearance="ghost"
                      accessoryLeft={<Icon name="close-outline" />}
                      onPress={() => confirmRemoveRow(rowIndex)}
                      style={styles.removeButton}
                    />
                  </View>
                ))}
                <View style={styles.row}>
                  {data[0].map((_, colIndex) => (
                    <Button
                      key={colIndex}
                      appearance="ghost"
                      accessoryLeft={<Icon name="close-outline" />}
                      onPress={() => confirmRemoveColumn(colIndex)}
                      style={styles.removeButton}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={styles.buttonContainer}>
              <Button onPress={addRow} style={styles.addButton}>
                Agregar Fila
              </Button>
              <Button onPress={addColumn} style={styles.addButton}>
                Agregar Columna
              </Button>
            </View>
          </Card>
        </ScrollView>

        <Button
          style={styles.fab}
          accessoryLeft={<Icon name="save-outline" />}
          onPress={handleSave}
        />

        <Modal visible={snackbarVisible} onBackdropPress={() => setSnackbarVisible(false)}>
          <Card>
            <Text>✅ Tabla guardada correctamente.</Text>
          </Card>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Estilos del componente.
 */
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  scrollView: { flexGrow: 1, paddingBottom: 80 },
  title: { textAlign: "center", marginBottom: 16 },
  card: { marginBottom: 16 },
  input: { marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  cell: { width: 120, height: 50, margin: 4 },
  removeButton: { marginLeft: 8 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 16 },
  addButton: { flex: 1, marginHorizontal: 4 },
  fab: { position: "absolute", right: 16, bottom: 16 },
});