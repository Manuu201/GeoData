import { View, StyleSheet, ScrollView } from "react-native"
import { Text, Card, Button, useTheme } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

export default function HomeScreen({ navigation }) {
  const theme = useTheme()

  const features = [
    { name: "Tablas", icon: "table-large", screen: "Tablas", color: "#3498db" },
    { name: "Fotos", icon: "image", screen: "Fotos", color: "#2ecc71" },
    { name: "Notas", icon: "notebook", screen: "Notas", color: "#e74c3c" },
  ]

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Bienvenido a GeoApp</Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>Tu asistente geológico de campo</Text>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Card key={index} style={[styles.featureCard, { backgroundColor: feature.color }]}>
              <Card.Content style={styles.cardContent}>
                <Icon name={feature.icon} size={48} color="#ffffff" />
                <Text style={styles.featureTitle}>{feature.name}</Text>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate(feature.screen)}
                  style={styles.button}
                  labelStyle={styles.buttonLabel}
                >
                  Ir a {feature.name}
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 32,
  },
  featuresContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  featureCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
  },
  cardContent: {
    alignItems: "center",
    padding: 24,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    color: "#ffffff",
  },
  cardActions: {
    justifyContent: "center",
    paddingBottom: 16,
  },
  button: {
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
})

