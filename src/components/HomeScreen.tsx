import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { TableEntity, fetchTablesAsync, addTableAsync, deleteTableAsync } from '../database/database';

// Definir el tipo de navegación
type RootStackParamList = {
  TableEditorScreen: { table: TableEntity };
};

export default function HomeScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'TableEditorScreen'>>();
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [newTableRows, setNewTableRows] = useState('');
  const [newTableColumns, setNewTableColumns] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  async function fetchTables() {
    const allTables = await fetchTablesAsync(db);
    setTables(allTables);
  }

  async function handleAddTable() {
    const rows = parseInt(newTableRows, 10);
    const columns = parseInt(newTableColumns, 10);
    if (newTableName.trim() === '' || rows <= 0 || columns <= 0) {
      console.error('❌ Datos inválidos para la tabla');
      return;
    }

    await addTableAsync(db, newTableName, rows, columns, Array(rows).fill(Array(columns).fill('')));
    setNewTableName('');
    setNewTableRows('');
    setNewTableColumns('');
    await fetchTables();
  }

  async function handleDeleteTable(id: number) {
    await deleteTableAsync(db, id);
    await fetchTables();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tablas</Text>
      
      <TextInput 
        placeholder="Nombre de la tabla" 
        value={newTableName} 
        onChangeText={setNewTableName} 
        style={styles.input} 
      />
      
      <TextInput 
        placeholder="Filas" 
        keyboardType="numeric" 
        value={newTableRows} 
        onChangeText={setNewTableRows} 
        style={styles.input} 
      />
      
      <TextInput 
        placeholder="Columnas" 
        keyboardType="numeric" 
        value={newTableColumns} 
        onChangeText={setNewTableColumns} 
        style={styles.input} 
      />
      
      <Button title="Agregar Tabla" onPress={handleAddTable} />

      <FlatList
        data={tables}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.tableItem}>
            <Text>{item.name}</Text>
            
            <View style={styles.buttonContainer}>
              <Button title="Editar" onPress={() => navigation.navigate('TableEditorScreen', { table: item })} />
              <Button title="Eliminar" onPress={() => handleDeleteTable(item.id)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { 
    height: 40, 
    borderColor: '#ccc', 
    borderWidth: 1, 
    marginBottom: 8, 
    paddingHorizontal: 8 
  },
  tableItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc' 
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8, // Espacio entre botones
  },
});
