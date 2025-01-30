import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { updateTableAsync } from '../database/database';
import { useNavigation, useRoute } from '@react-navigation/native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Card, Snackbar, FAB } from 'react-native-paper';

export default function TableEditorScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const route = useRoute();
  const { table, onSave } = route.params as { table: { id: number; name: string; data: string[][] }; onSave?: () => void };

  const [name, setName] = useState(table.name);
  const [data, setData] = useState<string[][]>(table.data);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  useEffect(() => {
    console.log('✏ Cargando datos de la tabla:', table);
  }, []);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setData(prevData => {
      const newData = prevData.map(row => [...row]);
      newData[rowIndex][colIndex] = value;
      return newData;
    });
  };

  async function handleSave() {
    console.log('📌 Guardando cambios en la tabla:', { name, data });
    await updateTableAsync(db, table.id, name, data.length, data[0]?.length || 0, data);

    if (onSave) onSave(); // 🔥 Se actualiza la lista en HomeScreen
    setSnackbarVisible(true);
    setTimeout(() => navigation.goBack(), 1500);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text style={styles.title}>Editar Tabla</Text>

          {/* Información de la Tabla */}
          <Card style={styles.card}>
            <Card.Title title="Información de la Tabla" />
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

          {/* Contenido de la Tabla */}
          <Card style={styles.card}>
            <Card.Title title="Contenido de la Tabla" />
            <Card.Content>
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
                </View>
              ))}
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Botón flotante para guardar */}
        <FAB style={styles.fab} icon="content-save" onPress={handleSave} />

        {/* Notificación de éxito */}
        <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={1500}>
          ✅ Tabla guardada correctamente.
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7f7' },
  container: { flex: 1, padding: 16 },
  scrollView: { flexGrow: 1, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  card: { marginBottom: 16, backgroundColor: '#fff' },
  input: { marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 8, justifyContent: 'center' },
  cell: { flex: 1, margin: 4, padding: 8, textAlign: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#6200ea' },
});
