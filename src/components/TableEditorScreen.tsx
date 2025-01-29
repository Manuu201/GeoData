import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { updateTableAsync } from '../database/database';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function TableEditorScreen() {
    const db = useSQLiteContext();
    const navigation = useNavigation();
    const route = useRoute();
    const { table } = route.params as { table: { id: number; name: string; data: string[][] } }; // ✅ Corrección
  
    const [name, setName] = useState(table.name);
    const [data, setData] = useState<string[][]>(table.data); // ✅ No usamos JSON.parse()
  
    useEffect(() => {
      console.log('✏ Cargando datos de la tabla:', table);
    }, []);
  
    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
      setData(prevData => {
        const newData = prevData.map(row => [...row]); // Copia profunda
        newData[rowIndex][colIndex] = value;
        return newData;
      });
    };
  
    async function handleSave() {
      console.log('📌 Guardando cambios en la tabla:', { name, data });
      await updateTableAsync(db, table.id, name, data.length, data[0]?.length || 0, data);
      navigation.goBack();
    }
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Editar Tabla</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Nombre de la tabla" />
  
        <FlatList
          data={data}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index: rowIndex }) => (
            <View style={styles.row}>
              {item.map((cell, colIndex) => (
                <TextInput
                  key={`${rowIndex}-${colIndex}`}
                  style={styles.cell}
                  value={cell}
                  onChangeText={(value) => handleCellChange(rowIndex, colIndex, value)}
                />
              ))}
            </View>
          )}
        />
  
        <Button title="Guardar Cambios" onPress={handleSave} />
      </View>
    );
  }
  

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 8, paddingHorizontal: 8 },
  row: { flexDirection: 'row', marginBottom: 8 },
  cell: { borderWidth: 1, borderColor: '#ccc', padding: 8, width: 100, textAlign: 'center' },
});
