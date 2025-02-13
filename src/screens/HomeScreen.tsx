import React from 'react';
import { ScrollView, StyleSheet, Animated } from 'react-native';
import { Layout, Text, Card, Button, Icon, TopNavigation, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const features = [
    { name: "Tablas", icon: "file-text-outline", screen: "Tablas", color: theme['color-primary-500'] },
    { name: "Fotos", icon: "image-outline", screen: "Fotos", color: theme['color-success-500'] },
    { name: "Notas", icon: "edit-2-outline", screen: "Notas", color: theme['color-danger-500'] },
  ];

  const renderFeatureCard = (feature, index) => (
    <Animated.View
      key={index}
      style={[
        styles.featureCardContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Card style={[styles.featureCard, { backgroundColor: feature.color }]}>
        <Icon name={feature.icon} fill={theme['color-basic-100']} style={styles.featureIcon} />
        <Text category='h6' style={styles.featureTitle}>{feature.name}</Text>
        <Button
          appearance='filled'
          onPress={() => navigation.navigate(feature.screen)}
          style={styles.button}
          size='small'
        >
          Explorar
        </Button>
      </Card>
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme['background-basic-color-1'] }}>
      <TopNavigation title='GeoApp' alignment='center' />
      <Layout style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Layout style={styles.header}>
            <Icon name='globe-2-outline' fill={theme['color-primary-500']} style={styles.headerIcon} />
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
    marginBottom: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
  },
  title: {
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: 'bold',
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
  featureCardContainer: {
    width: '48%',
    marginBottom: 16,
  },
  featureCard: {
    borderRadius: 16,
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  featureTitle: {
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    borderRadius: 20,
    minWidth: 120,
  },
});