import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Layout, Text, Input } from '@ui-kitten/components';
import { useSQLiteContext } from 'expo-sqlite';
import { createColumnAsync } from '../../database/database';
import { useTerrain } from '../../context/TerrainContext'; // Importar el contexto del terreno

/**
 * Pantalla para crear una nueva columna litológica.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.navigation - Objeto de navegación.
 * @returns {JSX.Element} - El componente renderizado.
 */
const CreateColumnScreen = ({ navigation }: { navigation: any }) => {
  const db = useSQLiteContext(); // Obtener la instancia de la base de datos desde el contexto
  const { terrainId } = useTerrain(); // Obtener el terreno seleccionado
  const [name, setName] = useState(''); // Estado para el nombre de la columna

  /**
   * Maneja la creación de una nueva columna.
   */
  const handleCreate = async () => {
    if (!terrainId) {
      Alert.alert("Error", "Debes seleccionar un terreno antes de crear una columna.");
      return;
    }

    if (!name) {
      Alert.alert("Error", "El nombre es requerido"); // Validar que el nombre no esté vacío
      return;
    }

    // Crear la columna en la base de datos
    await createColumnAsync(db, terrainId, name); // Pasar terrainId

    // Navegar de regreso a la pantalla anterior y forzar la recarga
    navigation.pop();
  };

  return (
    <Layout style={styles.container}>
      {/* Campo de entrada para el nombre de la columna */}
      <Input
        label="Nombre de Columna"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      {/* Botón para crear la columna */}
      <Button onPress={handleCreate}>Crear</Button>
    </Layout>
  );
};

// Estilos del componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
});

export default CreateColumnScreen;