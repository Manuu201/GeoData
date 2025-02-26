import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Layout, Text, Card, Button, Icon, TopNavigation, useTheme, TopNavigationAction } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function HomeScreen({ navigation }) {
  const theme = useTheme();

  // Acción para el ícono de engranaje
  const SettingsIcon = (props) => <Icon {...props} name="settings-outline" />;

  const SettingsAction = () => (
    <TopNavigationAction icon={SettingsIcon} onPress={() => navigation.navigate("SettingsScreen")} />
  );

  const features = [
    {
      name: "Tablas",
      icon: "grid-outline",
      screen: "TableScreen",
      color: theme["color-primary-500"],
      description: "Crea y gestiona tablas de datos geológicos.",
    },
    {
      name: "Fotos",
      icon: "camera-outline",
      screen: "PhotosScreen",
      color: theme["color-success-500"],
      description: "Captura y organiza fotos con ubicación geográfica.",
    },
    {
      name: "Notas",
      icon: "edit-2-outline",
      screen: "NotesScreen",
      color: theme["color-danger-500"],
      description: "Crea y gestiona notas geológicas detalladas.",
    },
    {
      name: "Informes",
      icon: "file-text-outline",
      screen: "ReportsScreen",
      color: theme["color-warning-500"],
      description: "Genera informes geológicos completos.",
    },
    {
      name: "Datos Estructurales",
      icon: "layers-outline",
      screen: "StructuralDataScreen",
      color: theme["color-info-500"],
      description: "Analiza y registra datos estructurales.",
    },
    {
      name: "Litología",
      icon: "map-outline",
      screen: "LithologyListScreen",
      color: theme["color-basic-800"],
      description: "Explora y gestiona columnas litológicas.",
    },
  ];

  const renderFeatureCard = (feature, index) => (
    <Animated.View
      key={index}
      entering={FadeInUp.delay(index * 200).duration(800)}
      style={styles.featureCardContainer}
    >
      <Card
        style={[styles.featureCard, { backgroundColor: feature.color }]}
        onPress={() => navigation.navigate(feature.screen)}
      >
        <Icon name={feature.icon} fill={theme["color-basic-100"]} style={styles.featureIcon} />
        <Text category="h6" style={styles.featureTitle}>
          {feature.name}
        </Text>
        <Text category="s1" style={styles.featureDescription}>
          {feature.description}
        </Text>
        <Button
          appearance="filled"
          onPress={() => navigation.navigate(feature.screen)}
          style={styles.button}
          size="small"
          accessoryRight={(props) => <Icon {...props} name="arrow-forward-outline" />}
        >
          Ver más
        </Button>
      </Card>
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme["background-basic-color-1"] }}>
      {/* TopNavigation con el ícono de engranaje */}
      <TopNavigation
        title="GeoApp"
        alignment="center"
        accessoryRight={SettingsAction} // Agrega el ícono de engranaje
      />
      <Layout style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          {/* Título con animación */}
          <Animated.View entering={FadeInDown.duration(800)}>
            <Text category="h1" style={styles.title}>
              GeoApp
            </Text>
            <Text category="s1" style={styles.subtitle}>
              Tu asistente geológico de campo
            </Text>
          </Animated.View>

          {/* Tarjetas de funcionalidades */}
          <Layout style={styles.featuresContainer}>{features.map(renderFeatureCard)}</Layout>
        </ScrollView>
      </Layout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 16,
  },
  title: {
    textAlign: "center",
    marginVertical: 16,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 24,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureCardContainer: {
    width: "48%", // Dos tarjetas por fila
    marginBottom: 16,
  },
  featureCard: {
    borderRadius: 12,
    alignItems: "center",
    padding: 12,
    height: 190, // Altura fija para todas las tarjetas
  },
  featureIcon: {
    width: 32,
    height: 32,
    marginBottom: 8,
  },
  featureTitle: {
    color: "white",
    marginBottom: 4,
    textAlign: "center",
    fontSize: 16,
  },
  featureDescription: {
    color: "white",
    opacity: 0.8,
    textAlign: "center",
    fontSize: 12,
    marginBottom: 8,
  },
  button: {
    borderRadius: 20,
    minWidth: 100,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "transparent",
  },
});