import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Button, ScrollView, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { addReportAsync, updateReportAsync, ReportEntity } from '../../database/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Layout, Input, Button as KittenButton } from '@ui-kitten/components'; // UI Kitten imports

type ReportsEditorScreenProps = NativeStackScreenProps<RootStackParamList, 'ReportsEditorScreen'>;

const predefinedTemplates = {
  sedimentary: [
    ["Minerales", "Forma", "Tamaño", "Color", "Porcentaje"],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""]
  ],
  igneous: [
    ["", "Minerales", "Fósiles", "Cemento", "Matriz"],
    ["Tipo", "", "", "", ""],
    ["Porcentaje", "", "", "", ""]
  ],
  free: Array(5).fill(Array(5).fill(""))
};

const dynamicTexts = {
  sedimentary: ["Fábrica", "Estructura", "Textura", "Tipo de Foliación", "Protolito", "Tipo de Metamorfismo", "Zona o Facie", "Grado"],
  igneous: ["Granulometría", "Madurez Textural", "Selección", "Redondez y Esfericidad", "Estructura Sedimentaria"],
  free: []
};

const ReportsEditorScreen: React.FC<ReportsEditorScreenProps> = ({ navigation, route }) => {
  const { report } = route.params || {};
  const [title, setTitle] = useState(report?.title || '');
  const [type, setType] = useState<'sedimentary' | 'igneous' | 'free'>(report?.type || 'sedimentary');
  const [dynamicTextsValues, setDynamicTextsValues] = useState<string[]>([]);
  const [tableData, setTableData] = useState<string[][]>(predefinedTemplates[report?.type || 'sedimentary']);
  const [photoUri, setPhotoUri] = useState(report?.photoUri || '');
  const [latitude, setLatitude] = useState(report?.latitude || 0);
  const [longitude, setLongitude] = useState(report?.longitude || 0);
  const [text2, setText2] = useState(report?.text2 || '');
  
  const db = useSQLiteContext();

  useEffect(() => {
    setDynamicTextsValues(dynamicTexts[type].map((_, i) => report?.text1 ? JSON.parse(report.text1)[i] || '' : ''));
    setTableData(predefinedTemplates[type]); 
  }, [type]);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a la cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
    }
  };

  const handleTableChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...tableData];
    newRows[rowIndex][colIndex] = value;
    setTableData(newRows);
  };

  const addRow = () => {
    setTableData([...tableData, Array(tableData[0]?.length || 5).fill('')]);
  };

  const removeRow = () => {
    if (tableData.length > 1) setTableData(tableData.slice(0, -1));
  };

  const addColumn = () => {
    setTableData(tableData.map(row => [...row, '']));
  };

  const removeColumn = () => {
    if (tableData[0]?.length > 1) setTableData(tableData.map(row => row.slice(0, -1)));
  };

  const handleSaveReport = async () => {
    const now = new Date().toISOString();
    const newReport: Omit<ReportEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      type: type as 'sedimentary' | 'igneous' | 'free',
      title,
      photoUri,
      latitude,
      longitude,
      text1: JSON.stringify(dynamicTextsValues),
      text2,
      tableData: JSON.stringify(tableData),
    };

    try {
      if (report) {
        await updateReportAsync(db, { ...report, ...newReport, updatedAt: now });
      } else {
        await addReportAsync(db, newReport);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar el reporte:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Layout style={styles.layout}>
        <Input
          label="Título"
          placeholder="Ingrese el título del reporte"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        <Picker selectedValue={type} onValueChange={(value) => setType(value)}>
          <Picker.Item label="Roca Sedimentaria" value="sedimentary" />
          <Picker.Item label="Roca Ígnea" value="igneous" />
          <Picker.Item label="Libre" value="free" />
        </Picker>

        {dynamicTexts[type].map((label, index) => (
          <View key={index} style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <Input
              style={styles.input}
              placeholder={`Ingrese ${label.toLowerCase()}`}
              value={dynamicTextsValues[index]}
              onChangeText={(value) => {
                const newValues = [...dynamicTextsValues];
                newValues[index] = value;
                setDynamicTextsValues(newValues);
              }}
            />
          </View>
        ))}

        <Input
          label="Texto libre"
          placeholder="Escriba su texto aquí"
          value={text2}
          onChangeText={setText2}
          multiline
          style={[styles.input, styles.largeInput]}
        />

        <View style={styles.tableControls}>
          <KittenButton onPress={addRow} style={styles.button}>➕ Fila</KittenButton>
          <KittenButton onPress={removeRow} style={styles.button}>➖ Fila</KittenButton>
          <KittenButton onPress={addColumn} style={styles.button}>➕ Columna</KittenButton>
          <KittenButton onPress={removeColumn} style={styles.button}>➖ Columna</KittenButton>
        </View>

        <View style={styles.tableContainer}>
          {tableData.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              {row.map((cell, colIndex) => (
                <Input
                  key={colIndex}
                  style={styles.tableCell}
                  value={cell}
                  onChangeText={(value) => handleTableChange(rowIndex, colIndex, value)}
                />
              ))}
            </View>
          ))}
        </View>

        <KittenButton onPress={handleTakePhoto} style={styles.button}>Tomar Foto</KittenButton>
        {photoUri && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <Text style={styles.coordinatesText}>
              Latitud: {latitude.toFixed(6)}, Longitud: {longitude.toFixed(6)}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveReport}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </Layout>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
  },
  layout: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  largeInput: {
    height: 100,
  },
  inputContainer: {
    marginBottom: 16,
  },
  tableControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tableContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableCell: {
    flex: 1,
    margin: 4,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    fontSize: 14,
  },
  label: {
    color: '#333',
    fontWeight: 'bold',
  },
  button: {
    marginVertical: 8,
  },
  photoContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#555',
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});


export default ReportsEditorScreen;
