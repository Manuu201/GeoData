import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Image, StyleSheet, Dimensions, Animated, PanResponder } from "react-native";
import { Layout, Text, Button } from '@ui-kitten/components';
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const rotateResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        setRotation(prev => (prev + gestureState.dx * 0.5) % 360);
      },
    })
  ).current;

  const adjustResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const deltaX = gestureState.moveX - centerX;
        const deltaY = gestureState.moveY - centerY;

        let newDipDir = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
        if (newDipDir < 0) newDipDir += 360;
        setDipDir(newDipDir);

        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        setDip(Math.min((distance / radius) * 90, 90));
      },
    })
  ).current;

  if (!photo) return <Text>Cargando...</Text>;

  return (
    <Layout style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="contain" />
      <Svg style={styles.overlay} {...rotateResponder.panHandlers}>
        <G transform={`rotate(${rotation}, ${centerX}, ${centerY})`}>
          <Circle cx={centerX} cy={centerY} r={radius} stroke="black" fill="none" strokeWidth={1.5} />
          <Line x1={centerX} y1={centerY - radius} x2={centerX} y2={centerY + radius} stroke="gray" strokeWidth={1} />
          <Line x1={centerX - radius} y1={centerY} x2={centerX + radius} y2={centerY} stroke="gray" strokeWidth={1} />

          {/* Etiquetas N, S, E, O */}
          <SvgText x={centerX} y={centerY - radius - 10} fill="black" textAnchor="middle" fontSize="14">N</SvgText>
          <SvgText x={centerX} y={centerY + radius + 20} fill="black" textAnchor="middle" fontSize="14">S</SvgText>
          <SvgText x={centerX - radius - 20} y={centerY} fill="black" textAnchor="middle" fontSize="14">O</SvgText>
          <SvgText x={centerX + radius + 20} y={centerY} fill="black" textAnchor="middle" fontSize="14">E</SvgText>

          <Line x1={centerX} y1={centerY} x2={centerX + radius * Math.cos((dipDir - 90) * (Math.PI / 180)) * (dip / 90)}
            y2={centerY + radius * Math.sin((dipDir - 90) * (Math.PI / 180)) * (dip / 90)}
            stroke="red" strokeWidth={2} />
        </G>
      </Svg>

      {/* Texto fijo del Dip y DipDir */}
      <View style={styles.dipInfo}>
        <Text category="h6">{`Dip: ${dip.toFixed(1)}°`}</Text>
        <Text category="h6">{`DipDir: ${dipDir.toFixed(1)}°`}</Text>
        <Text category="h6">{`Rotación: ${rotation.toFixed(1)}°`}</Text>
      </View>

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
  image: { width: "100%", height: "100%", position: 'absolute' },
  overlay: { width: "100%", height: "100%", position: 'absolute' },
  dipInfo: { position: 'absolute', top: 40, backgroundColor: 'rgba(255,255,255,0.7)', padding: 10, borderRadius: 10 },
  controls: { position: 'absolute', bottom: 20, flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
});

