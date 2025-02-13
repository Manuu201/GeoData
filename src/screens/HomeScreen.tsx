import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Layout, Text, Card, Button, Icon, TopNavigation } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  const features = [
    { name: "Tablas", icon: "file-text-outline", screen: "Tablas", color: "#3498db" },
    { name: "Fotos", icon: "image-outline", screen: "Fotos", color: "#2ecc71" },
    { name: "Notas", icon: "edit-2-outline", screen: "Notas", color: "#e74c3c" },
  ];

  const renderFeatureCard = (feature, index) => (
    <Card key={index} style={[styles.featureCard, { backgroundColor: feature.color }]}>
      <Icon name={feature.icon} fill="#ffffff" style={styles.featureIcon} />
      <Text category='h6' style={styles.featureTitle}>{feature.name}</Text>
      <Button
        appearance='filled'
        onPress={() => navigation.navigate(feature.screen)}
        style={styles.button}
      >
        Explorar
      </Button>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopNavigation title='GeoApp' alignment='center' />
      <Layout style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Layout style={styles.header}>
            <Icon name='globe-2-outline' fill='#3366FF' style={styles.headerIcon} />
            <Text category='h1' style={styles.title}>GeoApp</Text>
            <Text category='s1' style={styles.subtitle}>
              Tu asistente geológico de campo
            </Text>
          </Layout>
          <Layout style={styles.featuresContainer}>
            {features.map(renderFeatureCard)}
          </Layout>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
  },
  title: {
    textAlign: 'center',
    marginVertical: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  featureTitle: {
    color: '#ffffff',
    marginBottom: 8,
  },
  button: {
    borderRadius: 20,
  },
});