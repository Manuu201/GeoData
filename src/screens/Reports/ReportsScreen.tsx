import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { fetchReportsAsync, deleteReportAsync, ReportEntity } from '../../database/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useFocusEffect } from '@react-navigation/native'; // Importar useFocusEffect

type ReportsScreenProps = NativeStackScreenProps<RootStackParamList, 'ReportsScreen'>;

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation, route }) => {
  const [reports, setReports] = useState<ReportEntity[]>([]);
  const db = useSQLiteContext();

  // Recargar los reportes cuando la pantalla recibe el foco
  useFocusEffect(
    React.useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    const reports = await fetchReportsAsync(db);
    console.log('Reportes recuperados:', reports); // Verifica los datos recuperados
    setReports(reports);
  };

  // Editar un reporte
  const handleEditReport = (report: ReportEntity) => {
    navigation.navigate('ReportsEditorScreen', { report });
  };

  // Eliminar un reporte
  const handleDeleteReport = async (id: number) => {
    await deleteReportAsync(db, id);
    loadReports(); // Recargar la lista después de eliminar
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reportItem}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>Tipo: {item.type}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEditReport(item)}>
                <Text style={styles.editButton}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteReport(item.id)}>
                <Text style={styles.deleteButton}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('ReportsEditorScreen')}
      >
        <Text style={styles.addButtonText}>Crear Reporte</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  reportItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editButton: {
    color: 'blue',
  },
  deleteButton: {
    color: 'red',
  },
  addButton: {
    backgroundColor: 'green',
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ReportsScreen;