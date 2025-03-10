import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Layout } from '@ui-kitten/components';
import { useSQLiteContext } from 'expo-sqlite';

const SettingScreen = () => {
  const db = useSQLiteContext();

  const handleDeleteAllData = async () => {
    Alert.alert(
      'Borrar todos los datos',
      '¿Estás seguro de que deseas borrar todos los datos? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Eliminar todos los datos de la base de datos
              await db.execAsync('DELETE FROM terrains;');
              await db.execAsync('DELETE FROM notes;');
              await db.execAsync('DELETE FROM photos;');
              await db.execAsync('DELETE FROM tables;');
              await db.execAsync('DELETE FROM reports;');
              await db.execAsync('DELETE FROM columns;');
              await db.execAsync('DELETE FROM layers;');
              Alert.alert('Éxito', 'Todos los datos han sido borrados.');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron borrar los datos.');
            }
          },
        },
      ]
    );
  };

  return (
    <Layout style={styles.container} level="1">
      <Text category="h4" style={styles.title}>
        Configuración
      </Text>

      <View style={styles.settingItem}>
        <Text>Versión de la App: 1.0.0</Text>
      </View>

      <Button status="danger" onPress={handleDeleteAllData}>
        Borrar todos los datos
      </Button>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default SettingScreen;