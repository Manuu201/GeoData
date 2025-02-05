import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function HomeScreen({ navigation }) {
  const theme = useTheme();

  const features = [
    { name: "Tablas", icon: "table-large", screen: "Tablas", color: "#3498db" },
    { name: "Fotos", icon: "image", screen: "Fotos", color: "#2ecc71" },
    { name: "Notas", icon: "notebook", screen: "Notas", color: "#e74c3c" },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollView}>

        <View style={styles.header}>
          <Icon name="earth" size={64} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.primary }]}>GeoApp</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
            Tu asistente geológico de campo
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Card
              key={index}
              style={[styles.featureCard, { backgroundColor: feature.color }]}
              mode="elevated"
            >
              <Card.Content style={styles.cardContent}>
                <Icon name={feature.icon} size={56} color="#ffffff" />
                <Text style={styles.featureTitle}>{feature.name}</Text>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button
                  mode="contained-tonal"
                  onPress={() => navigation.navigate(feature.screen)}
                  style={styles.button}
                  labelStyle={styles.buttonLabel}
                >
                  Explorar
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.8,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    borderRadius: 20,
    elevation: 5,
  },
  cardContent: {
    alignItems: "center",
    paddingVertical: 32,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 12,
    color: "#ffffff",
  },
  cardActions: {
    justifyContent: "center",
    paddingBottom: 16,
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
