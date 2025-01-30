import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Alert, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { TableEntity, fetchTablesAsync, addTableAsync, deleteTableAsync } from '../database/database';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, TextInput, Button, FAB, Dialog, Portal } from 'react-native-paper';

type RootStackParamList = {
  TableEditorScreen: { table: TableEntity; onSave?: () => void };
};

export default function HomeScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'TableEditorScreen'>>();
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [newTableRows, setNewTableRows] = useState('');
  const [newTableColumns, setNewTableColumns] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTables();
    }, [])
  );

  async function fetchTables() {
    const allTables = await fetchTablesAsync(db);
    setTables(allTables);
  }

  async function handleAddTable() {
    const rows = parseInt(newTableRows, 10);
    const columns = parseInt(newTableColumns, 10);
    if (newTableName.trim() === '' || isNaN(rows) || isNaN(columns) || rows <= 0 || columns <= 0) {
      Alert.alert('Error', 'Ingrese un nombre y dimensiones válidas para la tabla.');
      return;
    }

    await addTableAsync(db, newTableName, rows, columns, Array(rows).fill(Array(columns).fill('')));
    setNewTableName('');
    setNewTableRows('');
    setNewTableColumns('');
    fetchTables();
  }

  async function handleDeleteTable() {
    if (deleteId !== null) {
      await deleteTableAsync(db, deleteId);
      fetchTables();
    }
    setDeleteId(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <Text style={styles.title}>📊 Tablas Geológicas</Text>

        <Card style={styles.inputCard}>
          <Card.Title title="Nueva Tabla" />
          <Card.Content>
            <TextInput label="Nombre de la tabla" value={newTableName} onChangeText={setNewTableName} style={styles.input} />
            <TextInput label="Filas" keyboardType="numeric" value={newTableRows} onChangeText={setNewTableRows} style={styles.input} />
            <TextInput label="Columnas" keyboardType="numeric" value={newTableColumns} onChangeText={setNewTableColumns} style={styles.input} />
            <Button mode="contained" onPress={handleAddTable} style={styles.addButton}>
              Agregar Tabla
            </Button>
          </Card.Content>
        </Card>

        <FlatList
          data={tables}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.tableCard} onPress={() => navigation.navigate('TableEditorScreen', { table: item, onSave: fetchTables })}>
              <Card.Title title={item.name} subtitle={`📏 ${item.rows} Filas | ${item.columns} Columnas`} />
              <Card.Actions>
                <Button icon="pencil" onPress={() => navigation.navigate('TableEditorScreen', { table: item, onSave: fetchTables })}>
                  Editar
                </Button>
                <Button icon="delete" onPress={() => setDeleteId(item.id)} color="red">
                  Eliminar
                </Button>
              </Card.Actions>
            </Card>
          )}
        />

        <Portal>
          <Dialog visible={deleteId !== null} onDismiss={() => setDeleteId(null)}>
            <Dialog.Title>¿Eliminar tabla?</Dialog.Title>
            <Dialog.Content>
              <Text>Esta acción no se puede deshacer.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeleteId(null)}>Cancelar</Button>
              <Button onPress={handleDeleteTable} color="red">
                Eliminar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <FAB style={styles.fab} icon="plus" onPress={handleAddTable} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7f7' },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  inputCard: { marginBottom: 16, backgroundColor: 'white' },
  input: { marginBottom: 8 },
  addButton: { marginTop: 8, backgroundColor: '#00796B' },
  list: { paddingBottom: 80 },
  tableCard: { marginBottom: 10, backgroundColor: 'white' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#6200ee' },
});
