import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Button, Layout, Text, Input, List, ListItem, Modal, Card, Icon, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { useSQLiteContext } from 'expo-sqlite';
import { addLayerAsync, fetchLayersAsync, updateLayerAsync, deleteLayerAsync, LithologyLayerEntity, updateLayerOrderAsync } from '../../database/database';
import LithologyColumn from '../../components/LithologyColumn';
import rockTypes from '../../data/rockTypes';
import structureTypes from '../../data/structuralTypes'; // Importar estructuras
import fossilTypes from '../../data/fossilTypes'; // Importar fósiles

const SearchIcon = (props) => <Icon {...props} name="search-outline" />;
const ArrowBackIcon = (props) => <Icon {...props} name="arrow-back" />;
const ArrowForwardIcon = (props) => <Icon {...props} name="arrow-forward" />;

const LithologyFormScreen = ({ route, navigation }) => {
  const db = useSQLiteContext();
  const { columnId } = route.params;
  const [type, setType] = useState<'sedimentary' | 'igneous' | 'metamorphic'>('sedimentary');
  const [subtype, setSubtype] = useState('');
  const [thickness, setThickness] = useState('');
  const [structure, setStructure] = useState(structureTypes[0].structure); // Inicializar con la primera estructura
  const [fossil, setFossil] = useState(fossilTypes[0].fossil); // Inicializar con el primer fósil
  const [layers, setLayers] = useState<LithologyLayerEntity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [editingLayer, setEditingLayer] = useState<LithologyLayerEntity | null>(null);

  // Estados para el flujo secuencial
  const [currentStep, setCurrentStep] = useState(1); // Paso actual
  const [showModal, setShowModal] = useState(false); // Mostrar modal de pasos

  // Estados independientes para la búsqueda
  const [searchQuerySubtype, setSearchQuerySubtype] = useState('');
  const [searchQueryStructure, setSearchQueryStructure] = useState('');
  const [searchQueryFossil, setSearchQueryFossil] = useState('');

  // Estados para la paginación
  const [currentPageSubtype, setCurrentPageSubtype] = useState(0);
  const [currentPageStructure, setCurrentPageStructure] = useState(0);
  const [currentPageFossil, setCurrentPageFossil] = useState(0);
  const itemsPerPage = 5; // Número de elementos por página

  // Cargar las capas de la columna
  useEffect(() => {
    const loadLayers = async () => {
      const layers = await fetchLayersAsync(db, columnId);
      setLayers(layers);
    };
    loadLayers();
  }, [columnId]);

  // Función para agregar o actualizar una capa
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
    setShowModal(false); // Cerrar el modal después de agregar la capa
    setCurrentStep(1); // Reiniciar el flujo
  };

  // Función para eliminar una capa
  const handleDeleteLayer = async (id: number) => {
    await deleteLayerAsync(db, id);
    const updatedLayers = await fetchLayersAsync(db, columnId);
    setLayers(updatedLayers);
  };

  // Función para editar una capa
  const handleEditLayer = (layer: LithologyLayerEntity) => {
    setType(layer.type);
    setSubtype(layer.subtype);
    setThickness(layer.thickness.toString());
    setStructure(layer.structure);
    setFossil(layer.fossils);
    setEditingLayer(layer);
    setShowModal(true); // Mostrar el modal para editar
  };

  // Función para mover una capa
  const handleMoveLayer = async (id: number, direction: 'up' | 'down') => {
    const index = layers.findIndex(layer => layer.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    // Crear una copia de las capas
    const updatedLayers = [...layers];

    // Intercambiar las capas
    [updatedLayers[index], updatedLayers[newIndex]] = [updatedLayers[newIndex], updatedLayers[index]];

    // Recalcular el orden para todas las capas
    updatedLayers.forEach((layer, i) => {
      layer.order = i + 1; // Actualizar el orden
    });

    // Actualizar el orden en la base de datos
    for (const layer of updatedLayers) {
      await updateLayerOrderAsync(db, layer.id, layer.order);
    }

    // Actualizar el estado local
    setLayers(updatedLayers);
  };

  // Función para filtrar elementos
  const filterItems = (items, query) => {
    if (!items) return []; // Si items es undefined, devuelve un arreglo vacío
    return items.filter(item => {
      const itemValue = item.subtype || item.structure || item.fossil;
      return itemValue && itemValue.toLowerCase().includes(query.toLowerCase());
    });
  };

  // Función para obtener los elementos paginados
  const getPaginatedItems = (items, currentPage) => {
    const startIndex = currentPage * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  // Función para manejar el cambio de página
  const handlePageChange = (setPage, currentPage, totalPages, direction) => {
    if (direction === 'next' && currentPage < totalPages - 1) {
      setPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      setPage(currentPage - 1);
    }
  };

  // Función para avanzar al siguiente paso
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
    console.log(`Avanzando al paso: ${currentStep + 1}`); // Verifica el flujo
    setCurrentStep(currentStep + 1);
  };
  // Función para retroceder al paso anterior
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Opciones para el tipo de roca
  const rockTypeOptions = [
    { label: 'Sedimentaria', value: 'sedimentary' },
    { label: 'Ígnea', value: 'igneous' },
    { label: 'Metamórfica', value: 'metamorphic' },
  ];

  // Renderizar el contenido del modal según el paso actual
  const renderModalContent = () => {
    switch (currentStep) {
      case 1: // Paso 1: Tipo y subtipo de roca
        return (
          <>
            <Text category="h6" style={styles.label}>Paso 1/4: Tipo y subtipo de roca</Text>
            <Select
              label="Tipo de roca"
              selectedIndex={new IndexPath(rockTypeOptions.findIndex(option => option.value === type))}
              onSelect={(index) => {
                if (!Array.isArray(index)) {
                  setType(rockTypeOptions[index.row].value as 'sedimentary' | 'igneous' | 'metamorphic');
                }
              }}
              value={type}
              style={styles.input}
            >
              {rockTypeOptions.map((option, i) => (
                <SelectItem key={i} title={option.label} />
              ))}
            </Select>
            <Input
              placeholder="Buscar subtipo"
              value={searchQuerySubtype}
              onChangeText={setSearchQuerySubtype}
              accessoryRight={SearchIcon}
              style={styles.searchInput}
            />
            <List
              data={getPaginatedItems(filterItems(rockTypes[type], searchQuerySubtype), currentPageSubtype)}
              keyExtractor={(item) => item?.subtype || Math.random().toString()}
              renderItem={({ item: dataItem }) => (
                <ListItem
                  title={dataItem.subtype}
                  accessoryLeft={() => (
                    <Image source={dataItem.image} style={styles.listImage} />
                  )}
                  onPress={() => setSubtype(dataItem.subtype)}
                  style={[
                    styles.listItem,
                    subtype === dataItem.subtype && styles.selectedListItem,
                  ]}
                />
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
      case 2: // Paso 2: Estructura
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
            <List
              data={getPaginatedItems(filterItems(structureTypes, searchQueryStructure), currentPageStructure)}
              keyExtractor={(item) => item?.structure || Math.random().toString()}
              renderItem={({ item: dataItem }) => (
                <ListItem
                  title={dataItem.structure}
                  accessoryLeft={() => (
                    <Image source={dataItem.image} style={styles.listImage} />
                  )}
                  onPress={() => setStructure(dataItem.structure)}
                  style={[
                    styles.listItem,
                    structure === dataItem.structure && styles.selectedListItem,
                  ]}
                />
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
      case 3: // Paso 3: Fósiles
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
            <List
              data={getPaginatedItems(filterItems(fossilTypes, searchQueryFossil), currentPageFossil)}
              keyExtractor={(item) => item?.fossil || Math.random().toString()}
              renderItem={({ item: dataItem }) => (
                <ListItem
                  title={dataItem.fossil}
                  accessoryLeft={() => (
                    <Image source={dataItem.image} style={styles.listImage} />
                  )}
                  onPress={() => setFossil(dataItem.fossil)}
                  style={[
                    styles.listItem,
                    fossil === dataItem.fossil && styles.selectedListItem,
                  ]}
                />
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
        case 4: // Paso 4: Espesor
        console.log("Renderizando Paso 4: Espesor"); // Verifica si se ejecuta
        return (
          <View style={styles.modalContent}> {/* Contenedor flexible */}
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
          </View>
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

      {/* Modal para la leyenda */}
      <Modal
        visible={showLegend}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setShowLegend(false)}
      >
        <Card disabled={true} style={styles.legendModal}>
          <Text category="h6" style={styles.legendTitle}>Leyenda</Text>
          <FlatList
            data={layers}
            keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
            renderItem={({ item: layer }) => (
              <View style={styles.legendItem}>
                <Text style={styles.legendText}>
                  {`${layer.subtype} (${layer.thickness}m)`}
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
      </Modal>

      <Button onPress={() => { setShowModal(true); setCurrentStep(1); }} style={styles.toggleButton}>
        Agregar capa
      </Button>

      {/* Modal para agregar una capa */}
      <Modal
        visible={showModal}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setShowModal(false)}
      >
        <Card disabled={true} style={styles.modal}>
          {renderModalContent()}
        </Card>
      </Modal>
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
    fontSize: 16, // Aumenta el tamaño del texto
    fontWeight: 'bold', // Hace el texto más destacado
  },
  input: {
    marginBottom: 16,
    width: '100%', // Asegura que el Input ocupe todo el ancho
  },
  searchInput: {
    marginBottom: 8,
    width: '100%', // Asegura que el Input de búsqueda ocupe todo el ancho
  },
  listItem: {
    paddingVertical: 8,
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
  },
  legendTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 18, // Aumenta el tamaño del título
    fontWeight: 'bold', // Hace el título más destacado
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
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  modal: {
    width: '90%', // Ocupa el 90% del ancho de la pantalla
    maxHeight: '90%', // Ocupa el 90% del alto de la pantalla
    padding: 16,
    justifyContent: 'center', // Centra el contenido verticalmente
    alignItems: 'center', // Centra el contenido horizontalmente
  },
  modalContent: {
    flex: 1, // Ocupa todo el espacio disponible dentro de la Card
    width: '100%', // Ocupa todo el ancho de la Card
    justifyContent: 'center', // Centra el contenido verticalmente
    alignItems: 'center', // Centra el contenido horizontalmente
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%', // Asegura que los botones ocupen todo el ancho
  },
  stepButton: {
    flex: 1, // Los botones ocupan el espacio disponible
    marginHorizontal: 8,
  },
});

export default LithologyFormScreen;