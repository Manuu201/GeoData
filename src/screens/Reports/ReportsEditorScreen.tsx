import React from "react";
import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Image } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { addReportAsync, updateReportAsync, type ReportEntity } from "../../database/database";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import {
  Layout,
  Text,
  Input,
  Button,
  Select,
  SelectItem,
  IndexPath,
  Card,
  Modal,
  Icon,
  useTheme,
} from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

type ReportsEditorScreenProps = NativeStackScreenProps<RootStackParamList, "ReportsEditorScreen">;

const predefinedTemplates = {
  sedimentary: [
    ["Minerales", "Forma", "Tamaño", "Color", "Porcentaje"],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
  ],
  igneous: [
    ["", "Minerales", "Fósiles", "Cemento", "Matriz"],
    ["Tipo", "", "", "", ""],
    ["Porcentaje", "", "", "", ""],
  ],
  free: Array(5).fill(Array(5).fill("")),
};

const dynamicTexts = {
  sedimentary: [
    "Fábrica",
    "Estructura",
    "Textura",
    "Tipo de Foliación",
    "Protolito",
    "Tipo de Metamorfismo",
    "Zona o Facie",
    "Grado",
  ],
  igneous: ["Granulometría", "Madurez Textural", "Selección", "Redondez y Esfericidad", "Estructura Sedimentaria"],
  free: [],
};

const ReportsEditorScreen: React.FC<ReportsEditorScreenProps> = ({ navigation, route }) => {
  const { report } = route.params || {};
  const [title, setTitle] = useState(report?.title || "");
  const [type, setType] = useState<"sedimentary" | "igneous" | "free">(report?.type || "sedimentary");
  const [dynamicTextsValues, setDynamicTextsValues] = useState<string[]>([]);
  const [tableData, setTableData] = useState<string[][]>(predefinedTemplates[report?.type || "sedimentary"]);
  const [photoUri, setPhotoUri] = useState(report?.photoUri || "");
  const [latitude, setLatitude] = useState(report?.latitude || 0);
  const [longitude, setLongitude] = useState(report?.longitude || 0);
  const [text2, setText2] = useState(report?.text2 || "");
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(new IndexPath(0));
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const db = useSQLiteContext();
  const theme = useTheme();

  useEffect(() => {
    setDynamicTextsValues(dynamicTexts[type].map((_, i) => (report?.text1 ? JSON.parse(report.text1)[i] || "" : "")));
    setTableData(predefinedTemplates[type]);
  }, [type, report?.text1]);

  const handleTakePhoto = async () => {
    // Solicitar permisos de cámara
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== "granted") {
      alert("Se necesitan permisos para acceder a la cámara.");
      return;
    }

    // Solicitar permisos de ubicación
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== "granted") {
      alert("Se necesitan permisos para acceder a la ubicación.");
      return;
    }

    // Tomar la foto
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Obtener la ubicación actual
      try {
        const location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
        console.log("Coordenadas obtenidas:", location.coords.latitude, location.coords.longitude);
      } catch (error) {
        console.error("Error al obtener la ubicación:", error);
        alert("No se pudo obtener la ubicación. Asegúrate de que los servicios de ubicación estén activados.");
      }

      // Guardar la URI de la foto
      setPhotoUri(result.assets[0].uri);
      setShowPhotoModal(true);
    }
  };

  const handleTableChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...tableData];
    newRows[rowIndex][colIndex] = value;
    setTableData(newRows);
  };

  const addRow = () => {
    setTableData([...tableData, Array(tableData[0]?.length || 5).fill("")]);
  };

  const removeRow = () => {
    if (tableData.length > 1) setTableData(tableData.slice(0, -1));
  };

  const addColumn = () => {
    setTableData(tableData.map((row) => [...row, ""]));
  };

  const removeColumn = () => {
    if (tableData[0]?.length > 1) setTableData(tableData.map((row) => row.slice(0, -1)));
  };

  const handleSaveReport = async () => {
    const now = new Date().toISOString();
    const newReport: Omit<ReportEntity, "id" | "createdAt" | "updatedAt"> = {
      type: type as "sedimentary" | "igneous" | "free",
      title,
      photoUri,
      latitude,
      longitude,
      text1: JSON.stringify(dynamicTextsValues),
      text2,
      tableData: JSON.stringify(tableData),
    };

    try {
      if (report) {
        await updateReportAsync(db, { ...report, ...newReport, updatedAt: now });
      } else {
        await addReportAsync(db, newReport);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error al guardar el reporte:", error);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme["background-basic-color-1"] }]}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Layout style={styles.container} level="1">
          <Input
            label="Título"
            placeholder="Ingrese el título del reporte"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <Select
            label="Tipo de Reporte"
            selectedIndex={selectedTypeIndex}
            onSelect={(index) => {
              setSelectedTypeIndex(index as IndexPath);
              setType(["sedimentary", "igneous", "free"][(index as IndexPath).row] as "sedimentary" | "igneous" | "free");
            }}
            style={styles.input}
          >
            <SelectItem title="Roca Sedimentaria" />
            <SelectItem title="Roca Ígnea" />
            <SelectItem title="Libre" />
          </Select>

          {dynamicTexts[type].map((label, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(index * 100)} exiting={FadeOutUp}>
              <Input
                label={label}
                placeholder={`Ingrese ${label.toLowerCase()}`}
                value={dynamicTextsValues[index]}
                onChangeText={(value) => {
                  const newValues = [...dynamicTextsValues];
                  newValues[index] = value;
                  setDynamicTextsValues(newValues);
                }}
                style={styles.input}
              />
            </Animated.View>
          ))}

          <Input
            label="Texto libre"
            placeholder="Escriba su texto aquí"
            value={text2}
            onChangeText={setText2}
            multiline
            textStyle={styles.multilineTextStyle}
            style={[styles.input, styles.largeInput]}
          />

          <Card style={styles.tableCard}>
            <Text category="h6" style={styles.tableTitle}>
              Tabla de Datos
            </Text>
            <View style={styles.tableControls}>
              <Button size="small" onPress={addRow} accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}>
                Fila
              </Button>
              <Button
                size="small"
                onPress={removeRow}
                accessoryLeft={(props) => <Icon {...props} name="minus-outline" />}
              >
                Fila
              </Button>
              <Button
                size="small"
                onPress={addColumn}
                accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
              >
                Columna
              </Button>
              <Button
                size="small"
                onPress={removeColumn}
                accessoryLeft={(props) => <Icon {...props} name="minus-outline" />}
              >
                Columna
              </Button>
            </View>

            <ScrollView horizontal>
              <View style={styles.tableContainer}>
                {tableData.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.tableRow}>
                    {row.map((cell, colIndex) => (
                      <Input
                        key={colIndex}
                        style={styles.tableCell}
                        value={cell}
                        onChangeText={(value) => handleTableChange(rowIndex, colIndex, value)}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>

          <Button
            onPress={handleTakePhoto}
            style={styles.button}
            accessoryLeft={(props) => <Icon {...props} name="camera-outline" />}
          >
            Tomar Foto
          </Button>

          {photoUri ? (
            <Card style={styles.photoCard}>
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <Text category="s1" style={styles.coordinatesText}>
                Latitud: {latitude.toFixed(6)}, Longitud: {longitude.toFixed(6)}
              </Text>
            </Card>
          ) : (
            <Text style={styles.noPhotoText}>No se ha tomado ninguna foto.</Text>
          )}

          <Button onPress={handleSaveReport} style={styles.saveButton}>
            Guardar Reporte
          </Button>
        </Layout>
      </ScrollView>

      <Modal visible={showPhotoModal} backdropStyle={styles.backdrop} onBackdropPress={() => setShowPhotoModal(false)}>
        <Card disabled>
          <Image source={{ uri: photoUri }} style={styles.modalPhoto} />
          <Text category="s1" style={styles.coordinatesText}>
            Latitud: {latitude.toFixed(6)}, Longitud: {longitude.toFixed(6)}
          </Text>
          <Button onPress={() => setShowPhotoModal(false)}>Cerrar</Button>
        </Card>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  largeInput: {
    minHeight: 100,
  },
  multilineTextStyle: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  tableCard: {
    marginBottom: 16,
  },
  tableTitle: {
    marginBottom: 8,
  },
  tableControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E4E9F2",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    width: 120,
    margin: 2,
    padding: 8,
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: "#E4E9F2",
  },
  button: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 16,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalPhoto: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginBottom: 16,
  },
  coordinatesText: {
    marginBottom: 16,
    textAlign: "center",
  },
  photoCard: {
    marginBottom: 16,
  },
  photo: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginBottom: 16,
  },
  noPhotoText: {
    textAlign: "center",
    marginBottom: 16,
    color: "gray",
  },
});

export default ReportsEditorScreen;