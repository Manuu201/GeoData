import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Button, ScrollView, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { addReportAsync, updateReportAsync, ReportEntity } from '../database/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type ReportsEditorScreenProps = NativeStackScreenProps<RootStackParamList, 'ReportsEditorScreen'>;

const ReportsEditorScreen: React.FC<ReportsEditorScreenProps> = ({ navigation, route }) => {
  const { report } = route.params || {};
  const [title, setTitle] = useState(report?.title || '');
  const [type, setType] = useState<'sedimentary' | 'igneous' | 'free'>(report?.type || 'sedimentary');
  const [dynamicTextsValues, setDynamicTextsValues] = useState<string[]>([]);
  const [tableData, setTableData] = useState<{ rows: string[][]; columns: string[] }>(
    report?.tableData ? JSON.parse(report.tableData) : {
      rows: [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']],
      columns: ['Minerales', 'Forma', 'Tamaño', 'Color', 'Porcentaje'],
    }
  );
  const [photoUri, setPhotoUri] = useState(report?.photoUri || '');
  const [latitude, setLatitude] = useState(report?.latitude || 0);
  const [longitude, setLongitude] = useState(report?.longitude || 0);

  const db = useSQLiteContext();

  const dynamicTexts = {
    sedimentary: ['Fábrica', 'Estructura', 'Textura', 'Tipo de Foliación', 'Protolito', 'Tipo de Metamorfismo', 'Zona o Facie', 'Grado'],
    igneous: ['Granulometría', 'Madurez Textural', 'Selección', 'Redondez y Esfericidad', 'Estructura Sedimentaria'],
    free: [],
  };

  useEffect(() => {
    setDynamicTextsValues(dynamicTexts[type].map(() => ''));
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
    const newRows = [...tableData.rows];
    newRows[rowIndex][colIndex] = value;
    setTableData({ ...tableData, rows: newRows });
  };

  const handleSaveReport = async () => {
    const newReport = {
      type,
      title,
      photoUri,
      latitude,
      longitude,
      text1: dynamicTextsValues[0] || '',
      text2: dynamicTextsValues[1] || '',
      tableData: JSON.stringify(tableData),
    };
  
    try {
      if (report) {
        await updateReportAsync(db, { ...report, ...newReport });
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
      <TextInput
        style={styles.input}
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
      />
      <Picker
        selectedValue={type}
        onValueChange={(value) => setType(value)}
      >
        <Picker.Item label="Roca Sedimentaria" value="sedimentary" />
        <Picker.Item label="Roca Ígnea" value="igneous" />
        <Picker.Item label="Libre" value="free" />
      </Picker>

      {dynamicTexts[type].map((label, index) => (
        <TextInput
          key={index}
          style={styles.input}
          placeholder={label}
          value={dynamicTextsValues[index]}
          onChangeText={(value) => {
            const newDynamicTextsValues = [...dynamicTextsValues];
            newDynamicTextsValues[index] = value;
            setDynamicTextsValues(newDynamicTextsValues);
          }}
        />
      ))}

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          {tableData.columns.map((column, colIndex) => (
            <Text key={colIndex} style={styles.tableHeaderCell}>
              {column}
            </Text>
          ))}
        </View>
        {tableData.rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.tableRow}>
            {row.map((cell, colIndex) => (
              <TextInput
                key={colIndex}
                style={styles.tableCell}
                value={cell}
                onChangeText={(value) => handleTableChange(rowIndex, colIndex, value)}
              />
            ))}
          </View>
        ))}
      </View>

      <Button title="Tomar Foto" onPress={handleTakePhoto} />
      {photoUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <Text style={styles.coordinates}>
            Latitud: {latitude}, Longitud: {longitude}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveReport}>
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
  },
  tableContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  coordinates: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: 'blue',
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ReportsEditorScreen;