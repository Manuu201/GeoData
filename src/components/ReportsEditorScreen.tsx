import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Menu, Card } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import {
  addReportAsync,
  updateReportAsync,
  addTableAsync,
  addPhotoAsync,
} from '../database/database';

const ReportEditorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const db = useSQLiteContext();
  const { report } = route.params as { report?: any } || {};

  // Estados del informe
  const [name, setName] = useState(report?.name || '');
  const [rockName, setRockName] = useState(report?.rock_name || '');
  const [type, setType] = useState(report?.type || '');
  const [notes, setNotes] = useState(report?.notes || '');
  const [photo, setPhoto] = useState(report?.photo_id || null);
  const [tableId, setTableId] = useState(report?.table_id || null);
  const [tableData, setTableData] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Cargar datos del informe si está en modo edición
  useEffect(() => {
    if (report) {
      setName(report.name);
      setRockName(report.rock_name);
      setType(report.type);
      setNotes(report.notes);
      setPhoto(report.photo_id);
      setTableId(report.table_id);
    }
  }, [report]);

  // Obtener la tabla si existe
  // Guardar informe
  const handleSave = async () => {
    try {
      if (report) {
        await updateReportAsync(db, report.id, name, rockName, type, notes, photo, tableId);
      } else {
        await addReportAsync(db, name, rockName, type, notes, photo, tableId);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar el informe:', error);
    }
  };

  // Seleccionar una foto
  const handleSelectPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const photoId = await addPhotoAsync(db, uri, 0, 0);
        setPhoto(photoId);
      }
    } catch (error) {
      console.error('Error al seleccionar la foto:', error);
    }
  };

  // Crear tabla según el tipo
  const handleCreateTable = async (selectedType: string) => {
    let initialData = [];
    let tableName = '';

    if (selectedType === 'Roca Metamórfica') {
      initialData = [['Minerales', 'Forma', 'Tamaño', 'Color', 'Porcentaje'], ...Array(5).fill(['', '', '', '', ''])];
      tableName = 'Tabla Metamórfica';
    } else if (selectedType === 'Roca Sedimentaria') {
      initialData = [['Tipo', 'Porcentaje', 'Minerales', 'Fósiles', 'Cemento', 'Matriz'], ...Array(2).fill(['', '', '', '', '', ''])];
      tableName = 'Tabla Sedimentaria';
    } else {
      initialData = [['']];
      tableName = 'Tabla en Blanco';
    }

    const newTableId = await addTableAsync(db, tableName, initialData.length, initialData[0].length, initialData);
    setTableId(newTableId);
    setType(selectedType);
    setMenuVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Campos del formulario */}
      <TextInput label="Nombre del Informe" value={name} onChangeText={setName} style={styles.input} />
      <TextInput label="Nombre de la Roca" value={rockName} onChangeText={setRockName} style={styles.input} />
      <TextInput label="Notas" value={notes} onChangeText={setNotes} multiline style={styles.input} />

      {/* Menú para seleccionar el tipo de informe */}
      <View style={{ position: 'relative', zIndex: 1 }}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button onPress={() => setMenuVisible(true)} style={styles.menuButton}>
              Seleccionar Tipo de Informe
            </Button>
          }
        >
          <Menu.Item onPress={() => handleCreateTable('Roca Metamórfica')} title="Roca Metamórfica" />
          <Menu.Item onPress={() => handleCreateTable('Roca Sedimentaria')} title="Roca Sedimentaria" />
          <Menu.Item onPress={() => handleCreateTable('Informe en Blanco')} title="Informe en Blanco" />
        </Menu>
      </View>

      {/* Botón para agregar foto */}
      <Button mode="contained" onPress={handleSelectPhoto} style={styles.button}>
        {photo ? 'Cambiar Foto' : 'Agregar Foto'}
      </Button>

      {/* Mostrar la tabla si existe */}
      {tableData && (
        <Card style={styles.tableCard}>
          <Card.Title title={tableData.name} />
          <Card.Content>
            {tableData.data.map((row: string[], rowIndex: number) => (
              <View key={rowIndex} style={styles.tableRow}>
                {row.map((cell, cellIndex) => (
                  <Text key={cellIndex} style={styles.tableCell}>
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Botón para guardar */}
      <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
        Guardar Informe
      </Button>
    </ScrollView>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  menuButton: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 16,
  },
  tableCard: {
    marginVertical: 16,
    padding: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
});

export default ReportEditorScreen;
