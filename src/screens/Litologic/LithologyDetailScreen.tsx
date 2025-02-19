import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const LithologyDetailScreen = ({ route }: { route: any }) => {
  const { lithology } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{lithology.subtype}</Text>
      <Text>Type: {lithology.type}</Text>
      <Text>Thickness: {lithology.thickness}m</Text>
      <Text>Structure: {lithology.structure}</Text>
      <Text>Fossils: {lithology.fossils}</Text>
      <Text>Geological Event: {lithology.geologicalEvent}</Text>
      <Text>Notes: {lithology.notes}</Text>
      {lithology.imageUri && <Image source={{ uri: lithology.imageUri }} style={styles.image} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 16,
  },
});

export default LithologyDetailScreen;