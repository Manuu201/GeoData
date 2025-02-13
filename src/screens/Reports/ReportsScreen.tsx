import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { fetchReportsAsync, deleteReportAsync, ReportEntity } from '../../database/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Layout, Input, Select, SelectItem, IndexPath } from '@ui-kitten/components';

type ReportsScreenProps = NativeStackScreenProps<RootStackParamList, 'ReportsScreen'>;

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation, route }) => {
  const [reports, setReports] = useState<ReportEntity[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<IndexPath>(new IndexPath(0)); // Cambiar a IndexPath
  const db = useSQLiteContext();

  // Recargar los reportes cuando la pantalla recibe el foco
  useFocusEffect(
    React.useCallback(() => {
      loadReports();
    }, [filter, sortOrder]) // Dependemos de filter y sortOrder
  );

  const loadReports = async () => {
    const reports = await fetchReportsAsync(db);
    // Aplicar filtro
    const filteredReports = reports.filter(report => 
      report.type.toLowerCase().includes(filter.toLowerCase())
    );
    // Ordenar por nombre o fecha
    const sortedReports = filteredReports.sort((a, b) => {
      if (sortOrder.row === 0) { // Orden ascendente por nombre
        return a.title.localeCompare(b.title);
      } else if (sortOrder.row === 1) { // Orden descendente por nombre
        return b.title.localeCompare(a.title);
      } else if (sortOrder.row === 2) { // Orden ascendente por fecha
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOrder.row === 3) { // Orden descendente por fecha
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    setReports(sortedReports);
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
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <Layout style={styles.container}>
        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <Input
            placeholder="Filtrar por tipo de reporte"
            value={filter}
            onChangeText={setFilter}
            style={styles.input}
          />
          <Select
            selectedIndex={sortOrder} // Pasamos el IndexPath directamente
            onSelect={(index) => setSortOrder(index instanceof IndexPath ? index : index[0])} // Aseguramos que se pase solo un IndexPath
            style={styles.select}
          >
            <SelectItem title="Nombre (A-Z)" />
            <SelectItem title="Nombre (Z-A)" />
            <SelectItem title="Fecha (Más antiguo)" />
            <SelectItem title="Fecha (Más reciente)" />
          </Select>
        </View>

        {/* Lista de reportes */}
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.reportItem}>
              <Text style={styles.title}>{item.title}</Text>
              <Text>Tipo: {item.type}</Text>
              <Text>Fecha: {new Date(item.createdAt).toLocaleDateString()}</Text>
              <View style={styles.actions}>
                <Button size="small" onPress={() => handleEditReport(item)}>Editar</Button>
                <Button size="small" status="danger" onPress={() => handleDeleteReport(item.id)}>Eliminar</Button>
              </View>
            </View>
          )}
        />
        
        {/* Botón para crear un nuevo reporte */}
        <Button
          style={styles.addButton}
          onPress={() => navigation.navigate('ReportsEditorScreen')}
        >
          Crear Reporte
        </Button>
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 16, // Añadir margen superior para evitar que los filtros queden pegados al borde
  },
  input: {
    flex: 2,
    marginRight: 8,
  },
  select: {
    flex: 1,
  },
  reportItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 8,
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
  addButton: {
    marginTop: 16,
    backgroundColor: 'green',
  },
});

export default ReportsScreen;