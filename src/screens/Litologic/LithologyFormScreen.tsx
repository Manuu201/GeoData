import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button, Layout, Text, Input } from '@ui-kitten/components';
import { useSQLiteContext } from "expo-sqlite";
import { addLayerAsync, fetchLayersAsync, LithologyLayerEntity } from '../../database/database';
import LithologyColumn from '../../components/LithologyColumn';
import rockTypes from '../../data/rockTypes'; // Importar los tipos de roca

const structures = [
  'Laminación paralela',
  'Laminación ondulada',
  'Laminación cruzada',
  'Estratificación cruzada planar',
  'Estratificación cruzada en surco',
  'Herringbone',
  'Hummocky',
  'Granoclasificación normal',
  'Granoclasificación inversa',
  'Estratificación lenticular',
  'Estratificación ondulada',
  'Estratificación flaser',
  'Imbricación de cantos',
  'Bioturbación en general',
  'Laminación de algas',
  'Estromatolitos',
  'Perforaciones',
  'Excavaciones',
  'Pistas pisadas',
  'Rizocreaciones',
  'Chondrites',
];

const fossils = [
  'Ammonites',
  'Trilobites',
  'Braquiópodos',
  'Gasterópodos',
  'Peces',
  'Dinosaurios',
  'Plantas',
];

const LithologyFormScreen = ({ route, navigation }) => {
  const db = useSQLiteContext(); // Obtener db desde el contexto
  const { columnId } = route.params;
  const [type, setType] = useState<'sedimentary' | 'igneous' | 'metamorphic'>('sedimentary'); // Tipo de roca seleccionado
  const [subtype, setSubtype] = useState(''); // Subtipo de roca seleccionado
  const [thickness, setThickness] = useState(''); // Espesor de la capa
  const [structure, setStructure] = useState(structures[0]); // Estructura seleccionada
  const [fossil, setFossil] = useState(fossils[0]); // Fósil seleccionado
  const [layers, setLayers] = useState<LithologyLayerEntity[]>([]); // Capas de la columna
  const [showForm, setShowForm] = useState(false); // Mostrar/ocultar formulario
  const [showLegend, setShowLegend] = useState(false); // Mostrar/ocultar leyenda

  // Cargar las capas de la columna
  useEffect(() => {
    const loadLayers = async () => {
      const layers = await fetchLayersAsync(db, columnId);
      setLayers(layers);
    };
    loadLayers();
  }, [columnId]);

  // Agregar una capa
  const handleAddLayer = async () => {
    if (!subtype || !thickness) {
      alert('Subtipo y espesor son requeridos');
      return;
    }

    const thicknessValue = parseFloat(thickness);
    if (thicknessValue > 20) {
      alert('El espesor debe ser de 20 metros o menos');
      return;
    }

    await addLayerAsync(db, columnId, type, subtype, thicknessValue, structure, fossil);
    const updatedLayers = await fetchLayersAsync(db, columnId);
    setLayers(updatedLayers);
    setShowForm(false); // Ocultar el formulario después de agregar una capa
  };

  // Datos para el FlatList del formulario
  const formData = [
    { type: 'header', content: 'Tipo de roca' },
    { type: 'picker', value: type, onChange: setType, items: [
      { label: 'Sedimentaria', value: 'sedimentary' },
      { label: 'Ígnea', value: 'igneous' },
      { label: 'Metamórfica', value: 'metamorphic' },
    ]},
    { type: 'header', content: 'Subtipo' },
    { type: 'subtypeList', data: rockTypes[type], selected: subtype, onChange: setSubtype },
    { type: 'input', label: 'Espesor (m)', value: thickness, onChange: setThickness, keyboardType: 'numeric' },
    { type: 'header', content: 'Estructura' },
    { type: 'picker', value: structure, onChange: setStructure, items: structures.map((struct) => ({ label: struct, value: struct })) },
    { type: 'header', content: 'Fósiles' },
    { type: 'picker', value: fossil, onChange: setFossil, items: fossils.map((foss) => ({ label: foss, value: foss })) },
    { type: 'button', title: 'Agregar capa', onPress: handleAddLayer },
  ];

  // Renderizar elementos del formulario
  const renderFormItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        return <Text category="h6" style={styles.label}>{item.content}</Text>;
      case 'picker':
        return (
          <Picker
            selectedValue={item.value}
            style={styles.picker}
            onValueChange={item.onChange}
          >
            {item.items.map((pickerItem, i) => (
              <Picker.Item key={i} label={pickerItem.label} value={pickerItem.value} />
            ))}
          </Picker>
        );
      case 'subtypeList':
        return (
          <FlatList
            data={item.data}
            keyExtractor={(rock) => rock.subtype}
            horizontal
            renderItem={({ item: rock }) => (
              <TouchableOpacity
                style={[
                  styles.subtypeItem,
                  item.selected === rock.subtype && styles.selectedSubtypeItem,
                ]}
                onPress={() => item.onChange(rock.subtype)}
              >
                <Image source={rock.image} style={styles.subtypeImage} />
                <Text style={styles.subtypeText}>{rock.subtype}</Text>
              </TouchableOpacity>
            )}
          />
        );
      case 'input':
        return (
          <Input
            label={item.label}
            value={item.value}
            onChangeText={item.onChange}
            keyboardType={item.keyboardType}
            style={styles.input}
          />
        );
      case 'button':
        return <Button onPress={item.onPress} style={styles.button}>{item.title}</Button>;
      default:
        return null;
    }
  };

  return (
    <Layout style={styles.container}>
      {/* Vista previa del gráfico */}
      <LithologyColumn layers={layers} />

      {/* Botón para mostrar/ocultar la leyenda */}
      <Button onPress={() => setShowLegend(!showLegend)} style={styles.toggleButton}>
        {showLegend ? 'Ocultar leyenda' : 'Mostrar leyenda'}
      </Button>

      {/* Leyenda */}
      {showLegend && (
        <View style={styles.legendContainer}>
          {layers.map((layer, index) => (
            <View key={index} style={styles.legendItem}>
              <Text style={styles.legendText}>
                {`${layer.subtype} (${layer.thickness}m)`}
              </Text>
              <Text style={styles.legendText}>
                {`Estructura: ${layer.structure}`}
              </Text>
              <Text style={styles.legendText}>
                {`Fósiles: ${layer.fossils}`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Botón para mostrar/ocultar el formulario */}
      <Button onPress={() => setShowForm(!showForm)} style={styles.toggleButton}>
        {showForm ? 'Ocultar formulario' : 'Agregar capa'}
      </Button>

      {/* Formulario para agregar capas */}
      {showForm && (
        <FlatList
          data={formData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderFormItem}
          contentContainerStyle={styles.formContainer}
        />
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  toggleButton: {
    marginVertical: 8,
  },
  formContainer: {
    paddingBottom: 16,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  subtypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  selectedSubtypeItem: {
    borderColor: '#007bff',
    backgroundColor: '#e3f2fd',
  },
  subtypeImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  subtypeText: {
    fontSize: 16,
  },
  legendContainer: {
    marginVertical: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  legendItem: {
    marginBottom: 8,
  },
  legendText: {
    fontSize: 12,
  },
});

export default LithologyFormScreen;