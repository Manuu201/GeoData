import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert, Modal, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Layout, Text, Card, Button, Icon, TopNavigation, useTheme, TopNavigationAction } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSQLiteContext } from "expo-sqlite";
import { fetchTerrainsAsync, addTerrainAsync, deleteTerrainAsync, updateTerrainAsync } from '../database/database';
import { useNavigation } from "@react-navigation/native";
import { useTerrain } from '../context/TerrainContext';
import RNPickerSelect from 'react-native-picker-select';

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { terrainId, setTerrainId } = useTerrain();
  const [terrains, setTerrains] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [newTerrainName, setNewTerrainName] = useState("");
  const [editTerrainId, setEditTerrainId] = useState(null);
  const [terrainToDelete, setTerrainToDelete] = useState(null);

  // Cargar terrenos al iniciar
  useEffect(() => {
    const loadTerrains = async () => {
      const terrains = await fetchTerrainsAsync(db);
      setTerrains(terrains);
    };
    loadTerrains();
  }, [db]);

  // Crear un nuevo terreno
  const handleCreateTerrain = async () => {
    if (newTerrainName.trim() === "") {
      Alert.alert("Error", "El nombre del terreno no puede estar vacío.");
      return;
    }

    const newTerrainId = await addTerrainAsync(db, newTerrainName);
    const updatedTerrains = await fetchTerrainsAsync(db);
    setTerrains(updatedTerrains);
    setNewTerrainName("");
    setIsModalVisible(false);

    // Seleccionar automáticamente el nuevo terreno creado
    setTerrainId(newTerrainId);
  };

  // Editar un terreno existente
  const handleEditTerrain = async () => {
    if (newTerrainName.trim() === "") {
      Alert.alert("Error", "El nombre del terreno no puede estar vacío.");
      return;
    }

    await updateTerrainAsync(db, editTerrainId, newTerrainName);
    const updatedTerrains = await fetchTerrainsAsync(db);
    setTerrains(updatedTerrains);
    setNewTerrainName("");
    setEditTerrainId(null);
    setIsModalVisible(false);
  };

  // Borrar un terreno
  const handleDeleteTerrain = async () => {
    await deleteTerrainAsync(db, terrainToDelete);
    const updatedTerrains = await fetchTerrainsAsync(db);
    setTerrains(updatedTerrains);
    if (terrainId === terrainToDelete) {
      setTerrainId(null); // Limpiar el terreno seleccionado si se borra
    }
    setIsDeleteModalVisible(false);
  };

  // Abrir modal para crear o editar terreno
  const openModal = (terrainId = null, name = "") => {
    setNewTerrainName(name);
    setEditTerrainId(terrainId);
    setIsModalVisible(true);
  };

  // Abrir modal de confirmación para eliminar terreno
  const openDeleteModal = (id) => {
    setTerrainToDelete(id);
    setIsDeleteModalVisible(true);
  };

  // Función para manejar la navegación
  const handleNavigation = (screen) => {
    if (!terrainId) {
      Alert.alert(
        "⚠️ Selecciona un Terreno",
        "Para continuar, primero debes seleccionar un terreno desde el selector en la parte superior.",
        [
          {
            text: "OK",
            onPress: () => console.log("OK Pressed"),
            style: "default",
          },
        ],
        { cancelable: false }
      );
      return;
    }
    navigation.navigate(screen);
  };

  // Lista de funcionalidades disponibles
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
      screen: "PhotoSelectorScreen",
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme["background-basic-color-1"] }}>
      <TopNavigation
        title="GeoApp"
        alignment="center"
        accessoryLeft={() => (
          <TopNavigationAction
            icon={(props) => <Icon {...props} name="settings-outline" />}
            onPress={() => navigation.navigate("SettingsScreen")}
          />
        )}
        accessoryRight={() => (
          <View style={{ flexDirection: "row" }}>
            <TopNavigationAction
              icon={(props) => <Icon {...props} name="plus-outline" />}
              onPress={() => openModal()}
            />
            <TopNavigationAction
              icon={(props) => <Icon {...props} name="trash-2-outline" />}
              onPress={() => terrainId && openDeleteModal(terrainId)}
              disabled={!terrainId}
            />
            <TopNavigationAction
              icon={(props) => <Icon {...props} name="edit-outline" />}
              onPress={() => terrainId && openModal(terrainId, terrains.find(t => t.id === terrainId)?.name)}
              disabled={!terrainId}
            />
          </View>
        )}
      />
      <Layout style={styles.container}>
        {/* Selector de terreno actual */}
        <View style={styles.terrainSelector}>
          <Text category="h6" style={styles.terrainTitle}>
            Terreno Actual:
          </Text>
          <RNPickerSelect
            onValueChange={(value) => setTerrainId(value)}
            items={terrains.map((terrain) => ({
              label: terrain.name,
              value: terrain.id,
            }))}
            value={terrainId}
            placeholder={{ label: "Selecciona un terreno", value: null }}
            style={pickerSelectStyles}
          />
          {!terrainId && (
            <Text category="s1" style={{ color: theme["color-danger-500"], marginTop: 8 }}>
              ⚠️ Debes seleccionar un terreno para continuar.
            </Text>
          )}
        </View>

        {/* Tarjetas de funcionalidades */}
        <ScrollView contentContainerStyle={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.delay(index * 200).duration(800)}
              style={styles.featureCardContainer}
            >
              <Card
                style={[styles.featureCard, { backgroundColor: feature.color }]}
                onPress={() => handleNavigation(feature.screen)}
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
                  onPress={() => handleNavigation(feature.screen)}
                  style={styles.button}
                  size="small"
                  accessoryRight={(props) => <Icon {...props} name="arrow-forward-outline" />}
                >
                  Ver más
                </Button>
              </Card>
            </Animated.View>
          ))}
        </ScrollView>
      </Layout>

      {/* Modal para crear/editar terreno */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text category="h6" style={styles.modalTitle}>
                {editTerrainId ? "Editar Terreno" : "Crear Terreno"}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Icon name="close-outline" fill="#000" style={styles.closeIcon} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Nombre del terreno"
              value={newTerrainName}
              onChangeText={setNewTerrainName}
              style={styles.modalInput}
            />
            <Button
              onPress={editTerrainId ? handleEditTerrain : handleCreateTerrain}
              style={styles.modalButton}
            >
              {editTerrainId ? "Guardar Cambios" : "Crear"}
            </Button>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación para eliminar terreno */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text category="h6" style={styles.modalTitle}>
                ¿Eliminar Terreno?
              </Text>
              <TouchableOpacity onPress={() => setIsDeleteModalVisible(false)}>
                <Icon name="close-outline" fill="#000" style={styles.closeIcon} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalText}>
              ¿Estás seguro de que deseas eliminar este terreno? Esta acción no se puede deshacer.
            </Text>
            <Button
              onPress={handleDeleteTerrain}
              style={styles.modalButton}
              status="danger"
            >
              Eliminar
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Estilos y configuraciones de RNPickerSelect
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  terrainSelector: {
    marginBottom: 24,
  },
  terrainTitle: {
    marginBottom: 8,
    color: "#FF5722",
    fontWeight: "bold",
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureCardContainer: {
    width: "48%",
    marginBottom: 16,
  },
  featureCard: {
    borderRadius: 12,
    alignItems: "center",
    padding: 12,
    height: 190,
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 16,
  },
  modalText: {
    marginBottom: 16,
    fontSize: 14,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "#000",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "#000",
    paddingRight: 30,
  },
});