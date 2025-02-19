import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Layout, Text, Input } from '@ui-kitten/components';
import { useSQLiteContext } from 'expo-sqlite';
import { createColumnAsync } from '../../database/database';

const CreateColumnScreen = ({ navigation }: { navigation: any }) => {
  const db = useSQLiteContext(); // Obtener db desde el contexto
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!name) {
      alert('Name is required');
      return;
    }

    // Crear la columna
    await createColumnAsync(db, name);

    // Navegar a LithologyListScreen y forzar la recarga
    navigation.pop();
  };

  return (
    <Layout style={styles.container}>
      <Input
        label="Column Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <Button onPress={handleCreate}>Create</Button>
    </Layout>
  );
};

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