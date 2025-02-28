import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Modal as RNModal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Button, Layout, Text, Input, Card, Icon } from '@ui-kitten/components';
import { useSQLiteContext } from 'expo-sqlite';
import { addLayerAsync, fetchLayersAsync, updateLayerAsync, deleteLayerAsync, LithologyLayerEntity, updateLayerOrderAsync } from '../../database/database';
import LithologyColumn from '../../components/LithologyColumn';
import rockTypes from '../../data/rockTypes';
import structureTypes from '../../data/structuralTypes';
import fossilTypes from '../../data/fossilTypes';
import RNPickerSelect from 'react-native-picker-select';

const { width } = Dimensions.get('window');

const SearchIcon = (props) => <Icon {...props} name="search-outline" />;
const ArrowBackIcon = (props) => <Icon {...props} name="arrow-back" />;
const ArrowForwardIcon = (props) => <Icon {...props} name="arrow-forward" />;

const LithologyFormScreen = ({ route, navigation }) => {
  const db = useSQLiteContext();
  const { columnId } = route.params;
  const [type, setType] = useState<'sedimentary' | 'igneous' | 'metamorphic'>('sedimentary');
  const [subtype, setSubtype] = useState('');
  const [thickness, setThickness] = useState('');
  const [structure, setStructure] = useState(structureTypes[0].structure);
  const [fossil, setFossil] = useState(fossilTypes[0].fossil);
  const [layers, setLayers] = useState<LithologyLayerEntity[]>([]);
  const [showLegend, setShowLegend] = useState(false);
  const [editingLayer, setEditingLayer] = useState<LithologyLayerEntity | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [searchQuerySubtype, setSearchQuerySubtype] = useState('');
  const [searchQueryStructure, setSearchQueryStructure] = useState('');
  const [searchQueryFossil, setSearchQueryFossil] = useState('');
  const [currentPageSubtype, setCurrentPageSubtype] = useState(0);
  const [currentPageStructure, setCurrentPageStructure] = useState(0);
  const [currentPageFossil, setCurrentPageFossil] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadLayers = async () => {
      const layers = await fetchLayersAsync(db, columnId);
      setLayers(layers);
    };
    loadLayers();
  }, [columnId]);

  const handleAddLayer = async () => {
    if (!subtype || !thickness || !structure || !fossil) {
      alert('Todos los campos son requeridos');
      return;
    }

    const thicknessValue = parseFloat(thickness);
    if (thicknessValue > 20) {
      alert('El espesor debe ser de 20 metros o menos');
      return;
    }

    if (editingLayer) {
      await updateLayerAsync(db, editingLayer.id, type, subtype, thicknessValue, structure, fossil);
      setEditingLayer(null);
    } else {
      await addLayerAsync(db, columnId, type, subtype, thicknessValue, structure, fossil);
    }

    const updatedLayers = await fetchLayersAsync(db, columnId);
    setLayers(updatedLayers);
    setShowModal(false);
    setCurrentStep(1);
  };

  const handleDeleteLayer = async (id: number) => {
    await deleteLayerAsync(db, id);
    const updatedLayers = await fetchLayersAsync(db, columnId);
    setLayers(updatedLayers);
  };

  const handleEditLayer = (layer: LithologyLayerEntity) => {
    setType(layer.type);
    setSubtype(layer.subtype);
    setThickness(layer.thickness.toString());
    setStructure(layer.structure);
    setFossil(layer.fossils);
    setEditingLayer(layer);
    setShowModal(true);
  };

  const handleMoveLayer = async (id: number, direction: 'up' | 'down') => {
    const index = layers.findIndex(layer => layer.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const updatedLayers = [...layers];
    [updatedLayers[index], updatedLayers[newIndex]] = [updatedLayers[newIndex], updatedLayers[index]];
    updatedLayers.forEach((layer, i) => {
      layer.order = i + 1;
    });

    for (const layer of updatedLayers) {
      await updateLayerOrderAsync(db, layer.id, layer.order);
    }

    setLayers(updatedLayers);
  };

  const filterItems = (items, query) => {
    if (!items) return [];
    return items.filter(item => {
      const itemValue = item.subtype || item.structure || item.fossil;
      return itemValue && itemValue.toLowerCase().includes(query.toLowerCase());
    });
  };

  const getPaginatedItems = (items, currentPage) => {
    const startIndex = currentPage * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const handlePageChange = (setPage, currentPage, totalPages, direction) => {
    if (direction === 'next' && currentPage < totalPages - 1) {
      setPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      setPage(currentPage - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && (!type || !subtype)) {
      alert('Debes seleccionar el tipo y subtipo de roca');
      return;
    }
    if (currentStep === 2 && !structure) {
      alert('Debes seleccionar una estructura');
      return;
    }
    if (currentStep === 3 && !fossil) {
      alert('Debes seleccionar un fósil');
      return;
    }
    if (currentStep === 4 && !thickness) {
      alert('Debes ingresar el espesor');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const rockTypeOptions = [
    { label: 'Sedimentaria', value: 'sedimentary' },
    { label: 'Ígnea', value: 'igneous' },
    { label: 'Metamórfica', value: 'metamorphic' },
  ];

  const renderModalContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Text category="h6" style={styles.label}>Paso 1/4: Tipo y subtipo de roca</Text>
            <RNPickerSelect
              onValueChange={(value) => setType(value)}
              items={rockTypeOptions}
              placeholder={{ label: 'Seleccione un tipo', value: null }}
              value={type}
              style={pickerSelectStyles}
            />
            <Input
              placeholder="Buscar subtipo"
              value={searchQuerySubtype}
              onChangeText={setSearchQuerySubtype}
              accessoryRight={SearchIcon}
              style={styles.searchInput}
            />
            <FlatList
              data={getPaginatedItems(filterItems(rockTypes[type], searchQuerySubtype), currentPageSubtype)}
              keyExtractor={(item) => item?.subtype || Math.random().toString()}
              renderItem={({ item: dataItem }) => (
                <TouchableOpacity
                  onPress={() => setSubtype(dataItem.subtype)}
                  style={[
                    styles.listItem,
                    subtype === dataItem.subtype && styles.selectedListItem,
                  ]}
                >
                  <Image source={dataItem.image} style={styles.listImage} />
                  <Text>{dataItem.subtype}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.paginationContainer}>
              <Button
                onPress={() => handlePageChange(setCurrentPageSubtype, currentPageSubtype, Math.ceil(filterItems(rockTypes[type], searchQuerySubtype).length / itemsPerPage), 'prev')}
                disabled={currentPageSubtype === 0}
                accessoryLeft={ArrowBackIcon}
              />
              <Text>{`Página ${currentPageSubtype + 1} de ${Math.ceil(filterItems(rockTypes[type], searchQuerySubtype).length / itemsPerPage)}`}</Text>
              <Button
                onPress={() => handlePageChange(setCurrentPageSubtype, currentPageSubtype, Math.ceil(filterItems(rockTypes[type], searchQuerySubtype).length / itemsPerPage), 'next')}
                disabled={currentPageSubtype === Math.ceil(filterItems(rockTypes[type], searchQuerySubtype).length / itemsPerPage) - 1}
                accessoryLeft={ArrowForwardIcon}
              />
            </View>
            <View style={styles.stepButtons}>
              <Button onPress={handleNextStep} style={styles.stepButton}>
                Siguiente
              </Button>
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text category="h6" style={styles.label}>Paso 2/4: Estructura</Text>
            <Input
              placeholder="Buscar estructura"
              value={searchQueryStructure}
              onChangeText={setSearchQueryStructure}
              accessoryRight={SearchIcon}
              style={styles.searchInput}
            />
            <FlatList
              data={getPaginatedItems(filterItems(structureTypes, searchQueryStructure), currentPageStructure)}
              keyExtractor={(item) => item?.structure || Math.random().toString()}
              renderItem={({ item: dataItem }) => (
                <TouchableOpacity
                  onPress={() => setStructure(dataItem.structure)}
                  style={[
                    styles.listItem,
                    structure === dataItem.structure && styles.selectedListItem,
                  ]}
                >
                  <Image source={dataItem.image} style={styles.listImage} />
                  <Text>{dataItem.structure}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.paginationContainer}>
              <Button
                onPress={() => handlePageChange(setCurrentPageStructure, currentPageStructure, Math.ceil(filterItems(structureTypes, searchQueryStructure).length / itemsPerPage), 'prev')}
                disabled={currentPageStructure === 0}
                accessoryLeft={ArrowBackIcon}
              />
              <Text>{`Página ${currentPageStructure + 1} de ${Math.ceil(filterItems(structureTypes, searchQueryStructure).length / itemsPerPage)}`}</Text>
              <Button
                onPress={() => handlePageChange(setCurrentPageStructure, currentPageStructure, Math.ceil(filterItems(structureTypes, searchQueryStructure).length / itemsPerPage), 'next')}
                disabled={currentPageStructure === Math.ceil(filterItems(structureTypes, searchQueryStructure).length / itemsPerPage) - 1}
                accessoryLeft={ArrowForwardIcon}
              />
            </View>
            <View style={styles.stepButtons}>
              <Button onPress={handlePreviousStep} style={styles.stepButton}>
                Anterior
              </Button>
              <Button onPress={handleNextStep} style={styles.stepButton}>
                Siguiente
              </Button>
            </View>
          </>
        );
      case 3:
        return (
          <>
            <Text category="h6" style={styles.label}>Paso 3/4: Fósiles</Text>
            <Input
              placeholder="Buscar fósil"
              value={searchQueryFossil}
              onChangeText={setSearchQueryFossil}
              accessoryRight={SearchIcon}
              style={styles.searchInput}
            />
            <FlatList
              data={getPaginatedItems(filterItems(fossilTypes, searchQueryFossil), currentPageFossil)}
              keyExtractor={(item) => item?.fossil || Math.random().toString()}
              renderItem={({ item: dataItem }) => (
                <TouchableOpacity
                  onPress={() => setFossil(dataItem.fossil)}
                  style={[
                    styles.listItem,
                    fossil === dataItem.fossil && styles.selectedListItem,
                  ]}
                >
                  <Image source={dataItem.image} style={styles.listImage} />
                  <Text>{dataItem.fossil}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.paginationContainer}>
              <Button
                onPress={() => handlePageChange(setCurrentPageFossil, currentPageFossil, Math.ceil(filterItems(fossilTypes, searchQueryFossil).length / itemsPerPage), 'prev')}
                disabled={currentPageFossil === 0}
                accessoryLeft={ArrowBackIcon}
              />
              <Text>{`Página ${currentPageFossil + 1} de ${Math.ceil(filterItems(fossilTypes, searchQueryFossil).length / itemsPerPage)}`}</Text>
              <Button
                onPress={() => handlePageChange(setCurrentPageFossil, currentPageFossil, Math.ceil(filterItems(fossilTypes, searchQueryFossil).length / itemsPerPage), 'next')}
                disabled={currentPageFossil === Math.ceil(filterItems(fossilTypes, searchQueryFossil).length / itemsPerPage) - 1}
                accessoryLeft={ArrowForwardIcon}
              />
            </View>
            <View style={styles.stepButtons}>
              <Button onPress={handlePreviousStep} style={styles.stepButton}>
                Anterior
              </Button>
              <Button onPress={handleNextStep} style={styles.stepButton}>
                Siguiente
              </Button>
            </View>
          </>
        );
      case 4:
        return (
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text category="h6" style={styles.label}>Paso 4/4: Espesor</Text>
            <Input
              label="Espesor (m)"
              value={thickness}
              onChangeText={setThickness}
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.stepButtons}>
              <Button onPress={handlePreviousStep} style={styles.stepButton}>
                Anterior
              </Button>
              <Button onPress={handleAddLayer} style={styles.stepButton}>
                Confirmar capa
              </Button>
            </View>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <Layout style={styles.container}>
      <LithologyColumn
        layers={layers}
        onDeleteLayer={handleDeleteLayer}
        onEditLayer={handleEditLayer}
        onMoveLayer={handleMoveLayer}
      />

      <Button onPress={() => setShowLegend(!showLegend)} style={styles.toggleButton}>
        {showLegend ? 'Ocultar leyenda' : 'Mostrar leyenda'}
      </Button>

      <RNModal
        visible={showLegend}
        transparent={true}
        onRequestClose={() => setShowLegend(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.legendModal}>
            <Text category="h6" style={styles.legendTitle}>Leyenda</Text>
            <FlatList
            data={layers}
            keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
            renderItem={({ item: layer }) => (
              <View style={styles.legendItem}>
                <Text style={styles.legendText}>
                  {`Tipo de Roca: ${layer.subtype} (${layer.thickness}m)`}
                </Text>
                <Image
                  source={rockTypes[layer.type].find(rock => rock.subtype === layer.subtype)?.image}
                  style={styles.legendImage}
                />
                <Text style={styles.legendText}>
                  {`Estructura: ${layer.structure}`}
                </Text>
                <Image
                  source={structureTypes.find(struct => struct.structure === layer.structure)?.image}
                  style={styles.legendImage}
                />
                <Text style={styles.legendText}>
                  {`Fósiles: ${layer.fossils}`}
                </Text>
                <Image
                  source={fossilTypes.find(fossil => fossil.fossil === layer.fossils)?.image}
                  style={styles.legendImage}
                />
              </View>
            )}
          />
            <Button onPress={() => setShowLegend(false)} style={styles.closeButton}>
              Cerrar
            </Button>
          </Card>
        </View>
      </RNModal>

      <Button onPress={() => { setShowModal(true); setCurrentStep(1); }} style={styles.toggleButton}>
        Agregar capa
      </Button>

      <RNModal
        visible={showModal}
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modal}>
            {renderModalContent()}
          </Card>
        </View>
      </RNModal>
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
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
    width: '100%',
  },
  searchInput: {
    marginBottom: 8,
    width: '100%',
  },
  listItem: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedListItem: {
    backgroundColor: '#e3f2fd',
  },
  listImage: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  legendModal: {
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  legendTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  legendItem: {
    marginBottom: 16,
  },
  legendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  legendImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  closeButton: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '90%',
    maxHeight: '90%',
    padding: 16,
  },
  modalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
  },
  stepButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
  },
});

export default LithologyFormScreen;