import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Image, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity } from "react-native";
import { Layout, Text, Button, Icon, Input } from '@ui-kitten/components';
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Svg, { Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../navigation/types";
import type { PhotoEntity } from "../../database/database";

type NavigationProp = StackNavigationProp<RootStackParamList, "StructuralDataScreen">;

export default function StructuralDataScreen({ route }) {
  const { photoId } = route.params;
  const db = useSQLiteContext();
  const navigation = useNavigation<NavigationProp>();
  const [photo, setPhoto] = useState<PhotoEntity | null>(null);
  const [dip, setDip] = useState(30); // Valor inicial de dip (0-90 grados)
  const [dipDir, setDipDir] = useState(45); // Valor inicial de dipDir (0-360 grados)
  const [imageScale, setImageScale] = useState(1); // Escala de la imagen
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 }); // Desplazamiento de la imagen
  const containerRef = useRef(null); // Referencia para capturar la imagen completa

  const { width, height } = Dimensions.get("window");
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;

  // Cargar la foto desde la base de datos
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchPhoto = async () => {
        try {
          const [result] = await db.getAllAsync<PhotoEntity>('SELECT * FROM photos WHERE id = ?;', [photoId]);
          if (isActive) setPhoto(result || null);
        } catch (error) {
          console.error("Error fetching photo:", error);
        }
      };
      if (photoId) {
        fetchPhoto();
      }
      return () => { isActive = false; };
    }, [photoId])
  );

  // Función para calcular las coordenadas del punto de dip/dipDir
  const calculateDipPoint = () => {
    const angle = (dipDir - 90) * (Math.PI / 180);
    const dipRadius = radius * (dip / 90);
    return {
      x: centerX + dipRadius * Math.cos(angle),
      y: centerY + dipRadius * Math.sin(angle),
    };
  };

  // Función para dibujar la curva de dip
  const drawDipCurve = () => {
    const startAngle = (dipDir - 90) * (Math.PI / 180);
    const endAngle = (dipDir + 90) * (Math.PI / 180);
    const dipRadius = radius * (dip / 90);

    const startX = centerX + dipRadius * Math.cos(startAngle);
    const startY = centerY + dipRadius * Math.sin(startAngle);
    const endX = centerX + dipRadius * Math.cos(endAngle);
    const endY = centerY + dipRadius * Math.sin(endAngle);

    return (
      <Path
        d={`M ${startX} ${startY} A ${dipRadius} ${dipRadius} 0 0 1 ${endX} ${endY}`}
        stroke="red"
        strokeWidth={2}
        fill="none"
      />
    );
  };

  // Guardar la imagen con el plano geológico superpuesto y el texto
  const saveImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert("Se necesitan permisos para guardar la imagen.");
        return;
      }

      // Capturar el componente completo (imagen + plano + texto)
      const uri = await captureRef(containerRef, {
        format: 'png',
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      alert("Imagen guardada en la galería.");
    } catch (error) {
      console.error("Error al guardar la imagen:", error);
    }
  };

  // Manejadores de gestos para mover y hacer zoom en la imagen
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        setImageOffset({
          x: imageOffset.x + gestureState.dx,
          y: imageOffset.y + gestureState.dy,
        });
      },
      onPanResponderRelease: () => {
        // Lógica adicional si es necesario
      },
    })
  ).current;

  const pinchResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newScale = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy) / 100;
        setImageScale(newScale);
      },
    })
  ).current;

  // Botones para mover la imagen
  const moveImage = (direction) => {
    const moveAmount = 20; // Cantidad de píxeles para mover la imagen
    switch (direction) {
      case 'up':
        setImageOffset((prev) => ({ ...prev, y: prev.y - moveAmount }));
        break;
      case 'down':
        setImageOffset((prev) => ({ ...prev, y: prev.y + moveAmount }));
        break;
      case 'left':
        setImageOffset((prev) => ({ ...prev, x: prev.x - moveAmount }));
        break;
      case 'right':
        setImageOffset((prev) => ({ ...prev, x: prev.x + moveAmount }));
        break;
      default:
        break;
    }
  };

  if (!photo) return <Text>Cargando...</Text>;

  return (
    <Layout style={styles.container}>
      {/* Contenedor para capturar la imagen completa */}
      <View ref={containerRef} collapsable={false} style={styles.captureContainer}>
        {/* Imagen de fondo con gestos de zoom y arrastre */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [
                { translateX: imageOffset.x },
                { translateY: imageOffset.y },
                { scale: imageScale },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="contain" />
        </Animated.View>

        {/* Red estereográfica */}
        <Svg style={styles.overlay}>
          <G>
            {/* Círculo principal */}
            <Circle cx={centerX} cy={centerY} r={radius} stroke="#333" fill="none" strokeWidth={1.5} />

            {/* Líneas cardinales */}
            <Line x1={centerX} y1={centerY - radius} x2={centerX} y2={centerY + radius} stroke="#666" strokeWidth={1} />
            <Line x1={centerX - radius} y1={centerY} x2={centerX + radius} y2={centerY} stroke="#666" strokeWidth={1} />

            {/* Etiquetas de ángulos cada 30 grados */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = i * 30;
              const rad = (angle - 90) * (Math.PI / 180);
              return (
                <SvgText
                  key={angle}
                  x={centerX + (radius + 20) * Math.cos(rad)}
                  y={centerY + (radius + 20) * Math.sin(rad)}
                  fill="#333"
                  textAnchor="middle"
                  fontSize="12"
                >
                  {angle}°
                </SvgText>
              );
            })}

            {/* Curva de dip */}
            {drawDipCurve()}

            {/* Punto indicador de dirección */}
            <Circle
              cx={calculateDipPoint().x}
              cy={calculateDipPoint().y}
              r={5}
              fill="red"
            />
          </G>
        </Svg>

        {/* Texto de Dip y DipDir */}
        <View style={styles.dipTextContainer}>
          <Text style={styles.dipText}>Dip: {dip.toFixed(1)}°</Text>
          <Text style={styles.dipText}>DipDir: {dipDir.toFixed(1)}°</Text>
        </View>
      </View>

      {/* Botones para mover la imagen */}
      <View style={styles.moveButtons}>
        <Button style={styles.moveButton} onPress={() => moveImage('up')}>⬆</Button>
        <Button style={styles.moveButton} onPress={() => moveImage('down')}>⬇</Button>
        <Button style={styles.moveButton} onPress={() => moveImage('left')}>⬅</Button>
        <Button style={styles.moveButton} onPress={() => moveImage('right')}>➡</Button>
      </View>

      {/* Controles para ajustar Dip y DipDir */}
      <View style={styles.controls}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dip (0-90°):</Text>
          <Input
            style={styles.input}
            value={dip.toString()}
            onChangeText={(text) => setDip(Math.min(90, Math.max(0, Number(text))))}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>DipDir (0-360°):</Text>
          <Input
            style={styles.input}
            value={dipDir.toString()}
            onChangeText={(text) => setDipDir(Number(text) % 360)}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Botón para guardar la imagen */}
      <TouchableOpacity style={styles.saveButton} onPress={saveImage}>
        <Icon name="save" fill="#FFF" style={styles.saveIcon} />
      </TouchableOpacity>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  captureContainer: { flex: 1, width: "100%", height: "100%" }, // Contenedor para capturar la imagen
  imageContainer: { position: 'absolute', width: "100%", height: "100%" },
  image: { width: "100%", height: "100%" },
  overlay: { width: "100%", height: "100%", position: 'absolute' },
  dipTextContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 10,
  },
  dipText: { fontSize: 16, fontWeight: 'bold' },
  moveButtons: {
    position: 'absolute',
    top: 100,
    left: 20,
    flexDirection: 'column',
  },
  moveButton: { marginVertical: 5 },
  controls: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
  },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  label: { marginRight: 10, fontSize: 14 },
  input: { width: 80 },
  saveButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#3366FF',
    padding: 10,
    borderRadius: 20,
  },
  saveIcon: { width: 24, height: 24 },
});