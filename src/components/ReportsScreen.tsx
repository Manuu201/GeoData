import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { fetchReportsAsync, deleteReportAsync } from '../database/database';
import { SQLiteDatabase } from 'expo-sqlite';

interface ReportScreenProps {
  db: SQLiteDatabase;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ db }) => {
  const navigation = useNavigation<{
    navigate: (screen: string, params: { db: SQLiteDatabase; report?: any }) => void;
  }>();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const data = await fetchReportsAsync(db);
    setReports(data);
  };

  const handleDelete = async (id: number) => {
    await deleteReportAsync(db, id);
    loadReports();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button mode="contained" onPress={() => navigation.navigate('ReportEditorScreen', { db })}>
        Crear Nuevo Informe
      </Button>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={{ marginVertical: 8 }}>
            <TouchableOpacity onPress={() => navigation.navigate('ReportEditorScreen', { db, report: item })}>
              <Card.Title title={item.name} subtitle={item.rock_name} />
              <Card.Content>
                <Text>{item.type}</Text>
              </Card.Content>
            </TouchableOpacity>
            <Card.Actions>
              <Button onPress={() => handleDelete(item.id)}>Eliminar</Button>
            </Card.Actions>
          </Card>
        )}
      />
    </View>
  );
};

export default ReportScreen;
