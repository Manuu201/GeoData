import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import rockTypes from '../data/rockTypes';
import StructureTypes from '../data/structuralTypes';
import FossilTypes from '../data/fossilTypes';
const LithologyColumn = ({ layers, onDeleteLayer, onEditLayer, onMoveLayer }) => {
  const totalThickness = layers.reduce((sum, layer) => sum + layer.thickness, 0);
  const scaleFactor = 10; // Factor de escala para convertir metros a píxeles
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [showDetail, setShowDetail] = useState(false); // Estado para mostrar el modal de detalles

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Column Lithology</Text>
      <Svg height={totalThickness * scaleFactor + 50} width="100%">
        {/* Eje Y */}
        <Line
          x1="50"
          y1="0"
          x2="50"
          y2={totalThickness * scaleFactor}
          stroke="#000"
          strokeWidth="2"
        />

        {/* Eje X */}
        <Line
          x1="50"
          y1={totalThickness * scaleFactor}
          x2="100%"
          y2={totalThickness * scaleFactor}
          stroke="#000"
          strokeWidth="2"
        />

        {/* Capas de roca */}
        {layers.map((layer, index) => {
          const y = layers.slice(0, index).reduce((sum, l) => sum + l.thickness, 0) * scaleFactor;
          const height = layer.thickness * scaleFactor;

          return (
            <React.Fragment key={index}>
              {/* Rectángulo que representa la capa */}
              <Rect
                x="50"
                y={y}
                width="80%"
                height={height}
                fill={getColorForType(layer.type)}
                onPress={() => setSelectedLayer(layer)}
              />

              {/* Etiqueta de la capa */}
              <SvgText
                x="60"
                y={y + height / 2 + 5}
                fill="#000"
                fontSize="12"
              >
                {`${layer.subtype} (${layer.thickness}m)`}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Botón para ver más detalles */}
      <TouchableOpacity style={styles.detailButton} onPress={() => setShowDetail(true)}>
        <Text style={styles.detailButtonText}>Ver más</Text>
      </TouchableOpacity>

      {/* Modal para mostrar la información de la capa */}
      <Modal
        visible={!!selectedLayer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedLayer(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedLayer?.subtype}</Text>
            <Text>Espesor: {selectedLayer?.thickness}m</Text>
            <Text>Estructura: {selectedLayer?.structure}</Text>
            <Text>Fósiles: {selectedLayer?.fossils}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  onEditLayer(selectedLayer);
                  setSelectedLayer(null);
                }}
              >
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  onDeleteLayer(selectedLayer.id);
                  setSelectedLayer(null);
                }}
              >
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  onMoveLayer(selectedLayer.id, 'up');
                  setSelectedLayer(null);
                }}
              >
                <Text style={styles.buttonText}>Subir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  onMoveLayer(selectedLayer.id, 'down');
                  setSelectedLayer(null);
                }}
              >
                <Text style={styles.buttonText}>Bajar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setSelectedLayer(null)}
              >
                <Text style={styles.buttonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para mostrar el gráfico con la leyenda detallada */}
      <Modal
        visible={showDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalContent}>
            <Text style={styles.detailModalTitle}>Leyenda Detallada</Text>
            <ScrollView>
              {layers.map((layer, index) => (
                <View key={index} style={styles.legendItem}>
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
                    source={StructureTypes.find(struct => struct.structure === layer.structure)?.image}
                    style={styles.legendImage}
                  />
                  <Text style={styles.legendText}>
                    {`Fósiles: ${layer.fossils}`}
                  </Text>
                  <Image
                    source={FossilTypes.find(fossil => fossil.fossil === layer.fossils)?.image}
                    style={styles.legendImage}
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.detailModalButton}
              onPress={() => setShowDetail(false)}
            >
              <Text style={styles.detailModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getColorForType = (type) => {
  switch (type) {
    case 'sedimentary':
      return '#f4a460'; // Sandy Brown
    case 'igneous':
      return '#8b4513'; // Saddle Brown
    case 'metamorphic':
      return '#696969'; // Dim Gray
    default:
      return '#000000'; // Black
  }
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginVertical: 8,
    alignItems: 'center',
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 10,
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  detailModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  detailModalContent: {
    width: '90%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: '80%',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
  detailModalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  detailModalButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default LithologyColumn;