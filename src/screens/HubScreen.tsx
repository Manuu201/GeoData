import React from "react";
import { View, StyleSheet } from "react-native";
import { Layout, Button, Icon, Text, useTheme } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../navigation/types";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";

type NavigationProp = StackNavigationProp<RootStackParamList, "HubScreen">;

export default function HubScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme["background-basic-color-1"] }]}>
      <Layout style={styles.container} level="1">
        {/* Título con animación */}
        <Animated.View entering={FadeInDown.duration(800)}>
          <Text category="h1" style={styles.title}>
            Herramientas Geológicas
          </Text>
        </Animated.View>

        {/* Contenedor de botones con animaciones */}
        <View style={styles.buttonContainer}>
          {/* Botón de Notas */}
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <Button
              style={styles.button}
              accessoryLeft={(props) => <Icon {...props} name="file-text-outline" />}
              onPress={() => navigation.navigate("NotesScreen")}
            >
              Notas
            </Button>
            <Text category="s1" style={styles.description}>
              Crea y gestiona notas geológicas detalladas.
            </Text>
          </Animated.View>

          {/* Botón de Fotos */}
          <Animated.View entering={FadeInUp.delay(400).duration(800)}>
            <Button
              style={styles.button}
              accessoryLeft={(props) => <Icon {...props} name="camera-outline" />}
              onPress={() => navigation.navigate("PhotosScreen")}
            >
              Fotos
            </Button>
            <Text category="s1" style={styles.description}>
              Captura y organiza fotos con ubicación geográfica.
            </Text>
          </Animated.View>

          {/* Botón de Tablas */}
          <Animated.View entering={FadeInUp.delay(600).duration(800)}>
            <Button
              style={styles.button}
              accessoryLeft={(props) => <Icon {...props} name="grid-outline" />}
              onPress={() => navigation.navigate("TableScreen")}
            >
              Tablas
            </Button>
            <Text category="s1" style={styles.description}>
              Crea y edita tablas de datos geológicos.
            </Text>
          </Animated.View>
        </View>

        {/* Animación de fondo (opcional) */}
        <Animated.View
          entering={ZoomIn.delay(1000).duration(1000)}
          style={styles.backgroundAnimation}
        >
          <Icon name="layers-outline" fill={theme["text-hint-color"]} style={styles.backgroundIcon} />
        </Animated.View>
      </Layout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: 32,
    textAlign: "center",
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "80%",
  },
  button: {
    marginBottom: 8,
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    color: "gray",
  },
  backgroundAnimation: {
    position: "absolute",
    bottom: 50,
    opacity: 0.2,
  },
  backgroundIcon: {
    width: 200,
    height: 200,
  },
});