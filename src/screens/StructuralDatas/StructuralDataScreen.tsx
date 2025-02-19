import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Image, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity } from "react-native";
import { Layout, Text, Button, Icon } from '@ui-kitten/components';
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import * as MediaLibrary from 'expo-media-library';
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../navigation/types";
import type { PhotoEntity } from "../../database/database";

type NavigationProp = StackNavigationProp<RootStackParamList, "StructuralDataScreen">;

export default function StructuralDataScreen({ route }) {
  const { photoId } = route.params;
  const db = useSQLiteContext();
  const navigation = useNavigation<NavigationProp>();
  const [photo, setPhoto] = useState<PhotoEntity | null>(null);
  const [dip, setDip] = useState(0);
  const [dipDir, setDipDir] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const svgRef = useRef(null);

  const { width, height } = Dimensions.get("window");
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;

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
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
      return () => { isActive = false; };
    }, [photoId])
  );

  // Guardar la imagen con la red estereográfica
  const saveImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert("Se necesitan permisos para guardar la imagen.");
        return;
      }

      const uri = await captureRef(svgRef, {
        format: 'png',
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      alert("Imagen guardada en la galería.");
    } catch (error) {
      console.error("Error al guardar la imagen:", error);
    }
  };

  // Ajustar la imagen al plano (zoom y pan)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        setOffset({
          x: offset.x + gestureState.dx,
          y: offset.y + gestureState.dy,
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
        setScale(newScale);
      },
    })
  ).current;

  if (!photo) return <Text>Cargando...</Text>;

  return (
    <Layout style={styles.container}>
      {/* Imagen con ajuste de zoom y pan */}
      <Animated.View
        style={[
          styles.imageContainer,
          { transform: [{ translateX: offset.x }, { translateY: offset.y }, { scale }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="contain" />
      </Animated.View>

      {/* Red estereográfica */}
      <Svg style={styles.overlay} ref={svgRef}>
        <G transform={`rotate(${rotation}, ${centerX}, ${centerY})`}>
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

          {/* Línea de dirección de inclinación */}
          <Line
            x1={centerX}
            y1={centerY}
            x2={centerX + radius * Math.cos((dipDir - 90) * (Math.PI / 180)) * (dip / 90)}
            y2={centerY + radius * Math.sin((dipDir - 90) * (Math.PI / 180)) * (dip / 90)}
            stroke="red"
            strokeWidth={2}
          />

          {/* Punto indicador de dirección */}
          <Circle
            cx={centerX + radius * Math.cos((dipDir - 90) * (Math.PI / 180)) * (dip / 90)}
            cy={centerY + radius * Math.sin((dipDir - 90) * (Math.PI / 180)) * (dip / 90)}
            r={5}
            fill="red"
          />
        </G>
      </Svg>

      {/* Botón para guardar la imagen */}
      <TouchableOpacity style={styles.saveButton} onPress={saveImage}>
        <Icon name="save" fill="#FFF" style={styles.saveIcon} />
      </TouchableOpacity>

      {/* Información de Dip y DipDir */}
      <View style={styles.dipInfo}>
        <Text category="h6">{`Dip: ${dip.toFixed(1)}°`}</Text>
        <Text category="h6">{`DipDir: ${dipDir.toFixed(1)}°`}</Text>
        <Text category="h6">{`Rotación: ${rotation.toFixed(1)}°`}</Text>
      </View>

      {/* Controles para ajustar Dip, DipDir y Rotación */}
      <View style={styles.controls}>
        <Button onPress={() => setDip(prev => Math.min(prev + 1, 90))}>⬆ Dip</Button>
        <Button onPress={() => setDip(prev => Math.max(prev - 1, 0))}>⬇ Dip</Button>
        <Button onPress={() => setDipDir(prev => (prev + 5) % 360)}>➡ DipDir</Button>
        <Button onPress={() => setDipDir(prev => (prev - 5 + 360) % 360)}>⬅ DipDir</Button>
        <Button onPress={() => setRotation(prev => (prev + 5) % 360)}>↻ Rotar</Button>
        <Button onPress={() => setRotation(prev => (prev - 5 + 360) % 360)}>↺ Rotar</Button>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { position: 'absolute', width: "100%", height: "100%" },
  image: { width: "100%", height: "100%" },
  overlay: { width: "100%", height: "100%", position: 'absolute' },
  dipInfo: { position: 'absolute', top: 40, backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 10 },
  controls: { position: 'absolute', bottom: 20, flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  saveButton: { position: 'absolute', top: 20, right: 20, backgroundColor: '#3366FF', padding: 10, borderRadius: 20 },
  saveIcon: { width: 24, height: 24 },
});

async function captureRef(svgRef: any, options: { format: string; quality: number; }) {
  try {
    const uri = await svgRef.toDataURL(options.format, options.quality);
    return uri;
  } catch (error) {
    console.error("Error capturing SVG:", error);
    throw error;
  }
}


