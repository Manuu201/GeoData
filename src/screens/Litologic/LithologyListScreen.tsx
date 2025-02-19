import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Button, Layout, Text, Card } from '@ui-kitten/components';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from "expo-sqlite";
import { fetchColumnsAsync, deleteColumnAsync, LithologyColumnEntity } from '../../database/database';

const LithologyListScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const db = useSQLiteContext(); // Obtener db desde el contexto
  const [columns, setColumns] = useState<LithologyColumnEntity[]>([]);

  // Cargar las columnas
  const loadColumns = async () => {
    const columns = await fetchColumnsAsync(db);
    setColumns(columns);
  };

  // Recargar los datos cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadColumns();
    }, [])
  );

  // Manejar el parámetro de recarga
  useEffect(() => {
    if (route.params?.shouldRefresh) {
      loadColumns();
    }
  }, [route.params?.shouldRefresh]);

  // Eliminar una columna
  const handleDelete = async (id: number) => {
    await deleteColumnAsync(db, id);
    loadColumns();
  };

  return (
    <Layout style={styles.container}>
      <FlatList
        data={columns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.item} onPress={() => navigation.navigate('LithologyFormScreen', { columnId: item.id })}>
            <View style={styles.itemContent}>
              <Text category="h6">{item.name}</Text>
              <Button status="danger" onPress={() => handleDelete(item.id)}>Delete</Button>
            </View>
          </Card>
        )}
      />
      <Button style={styles.addButton} onPress={() => navigation.navigate('CreateColumnScreen')}>
        Add New Column
      </Button>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  item: {
    marginBottom: 8,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    marginTop: 16,
  },
});

export default LithologyListScreen;