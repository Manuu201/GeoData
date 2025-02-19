import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

const LithologyColumn = ({ layers }) => {
  const totalThickness = layers.reduce((sum, layer) => sum + layer.thickness, 0);
  const scaleFactor = 10; // Factor de escala para convertir metros a píxeles

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
            
              {/* Leyenda: Estructura y fósiles 
                <SvgText
                x="60"
                y={y + height + 20}
                fill="#000"
                fontSize="10"
              >
                {`Estructura: ${layer.structure}`}
              </SvgText>
              <SvgText
                x="60"
                y={y + height + 35}
                fill="#000"
                fontSize="10"
              >
                {`Fósiles: ${layer.fossils}`}
              </SvgText>
              */}
              
            </React.Fragment>
          );
        })}
      </Svg>
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
});

export default LithologyColumn;