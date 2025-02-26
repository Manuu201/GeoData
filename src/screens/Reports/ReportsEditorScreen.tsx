import React, { useState, useEffect, useRef } from "react";
import { View, ScrollView, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { addReportAsync, updateReportAsync, type ReportEntity } from "../../database/database";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import * as ImageManipulator from 'expo-image-manipulator';
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
import Svg, { Circle, Polygon, Text as SvgText, Line } from "react-native-svg";
import * as d3 from "d3";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';
type ReportsEditorScreenProps = NativeStackScreenProps<RootStackParamList, "ReportsEditorScreen">;



const predefinedTemplates = {
  sedimentary: [
    ["Tipo", "Porcentaje"],
    ["Minerales", ""],
    ["Fósiles", ""],
    ["Cemento", ""],
    ["Matriz", ""],
  ],
  igneous: [
    ["Minerales", "Forma", "Tamaño", "Hábito", "Color", "Porcentaje"],
    ["Cuarzo", "", "", "", "", ""],
    ["Feldespato", "", "", "", "", ""],
    ["Plagioclasa", "", "", "", "", ""],
  ],
  metamorphic: [
    ["Minerales", "Forma", "Tamaño", "Color", "Porcentaje"],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
  ],
  free: Array(5).fill(Array(5).fill("")),
};

const dynamicTexts = {
  sedimentary: [
    "Granulometría",
    "Madurez Textural",
    "Selección",
    "Redondez y Esfericidad",
    "Estructura Sedimentaria",
  ],
  igneous: [
    "Textura",
    "Estructura",
    "Fábrica",
    "Grado de Cristalinidad",
    "Tamaño de Grano",
    "Morfología Especial",
    "Índice de Color",
  ],
  metamorphic: [
    "Fábrica",
    "Estructura",
    "Textura",
    "Tipo de Foliación",
    "Protolito",
    "Tipo de Metamorfismo",
    "Zona o Facie",
    "Grado",
  ],
  free: [],
};

const ReportsEditorScreen: React.FC<ReportsEditorScreenProps> = ({ navigation, route }) => {
  const { report } = route.params || {};
  const [title, setTitle] = useState(report?.title || "");
  const [type, setType] = useState<"sedimentary" | "igneous" | "metamorphic" | "free">(report?.type || "sedimentary");
  const [dynamicTextsValues, setDynamicTextsValues] = useState<string[]>([]);
  const [tableData, setTableData] = useState<string[][]>(predefinedTemplates[report?.type || "sedimentary"]);
  const [photoUri, setPhotoUri] = useState(report?.photoUri || "");
  const [latitude, setLatitude] = useState(report?.latitude || 0);
  const [longitude, setLongitude] = useState(report?.longitude || 0);
  const [text2, setText2] = useState(report?.text2 || "");
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(new IndexPath(0));
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [mineralData, setMineralData] = useState<{ Q: number; A: number; P: number } | null>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const db = useSQLiteContext();
  const theme = useTheme();

  useEffect(() => {
    setDynamicTextsValues(dynamicTexts[type].map((_, i) => (report?.text1 ? JSON.parse(report.text1)[i] || "" : "")));
    setTableData(predefinedTemplates[type]);
  }, [type, report?.text1]);

   
  useEffect(() => {
    if (type === "igneous") {
      const { Q, A, P } = extractMineralData(tableData);
      const normalizedData = normalizeData(Q, A, P);
      setMineralData(normalizedData);
    } else {
      setMineralData(null);
    }
  }, [tableData, type]);
  useEffect(() => {
    const loadReportData = async () => {
      if (report) {
        // Cargar los datos del reporte desde la base de datos
        setTitle(report.title);
        setType(report.type);
        setPhotoUri(report.photoUri);
        setLatitude(report.latitude);
        setLongitude(report.longitude);
        setText2(report.text2);
  
        // Cargar los valores dinámicos
        if (report.text1) {
          setDynamicTextsValues(JSON.parse(report.text1));
        } else {
          setDynamicTextsValues(dynamicTexts[report.type].map(() => ""));
        }
  
        // Cargar los datos de la tabla
        if (report.tableData) {
          setTableData(JSON.parse(report.tableData));
        } else {
          setTableData(predefinedTemplates[report.type]);
        }
      } else {
        // Si no hay reporte, inicializar con valores por defecto
        setTitle("");
        setType("sedimentary");
        setPhotoUri("");
        setLatitude(0);
        setLongitude(0);
        setText2("");
        setDynamicTextsValues(dynamicTexts["sedimentary"].map(() => ""));
        setTableData(predefinedTemplates["sedimentary"]);
      }
    };
  
    loadReportData();
  }, [report]);
  

  const captureDiagram = async (ref: React.RefObject<ViewShot>) => {
    if (ref.current) {
      try {
        const uri = await ref.current.capture();
        const resizedUri = await resizeImage(uri); // Redimensionar el diagrama
        const base64 = await FileSystem.readAsStringAsync(resizedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      } catch (error) {
        console.error("Error al capturar el diagrama:", error);
        return null;
      }
    }
    return null;
  };
  
  const resizeImage = async (uri) => {
    try {
      // Redimensionar la imagen a un ancho máximo de 800px (puedes ajustar este valor)
      const resizedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500 } }], // Ajusta el ancho según sea necesario
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG } // Comprimir la imagen
      );
      return resizedImage.uri;
    } catch (error) {
      console.error("Error al redimensionar la imagen:", error);
      return null;
    }
  };
  
  const getPhotoBase64 = async (uri) => {
    try {
      // Redimensionar la imagen antes de convertirla a base64
      const resizedUri = await resizeImage(uri);
      if (!resizedUri) return null;
  
      // Convertir la imagen redimensionada a base64
      const base64 = await FileSystem.readAsStringAsync(resizedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error("Error al convertir la foto a base64:", error);
      return null;
    }
  };
  const extractBase64 = (dataURI) => {
    const prefix = "data:image/png;base64,";
    if (dataURI.startsWith(prefix)) {
      return dataURI.slice(prefix.length);
    }
    return null;
  };
  const saveTempImage = async (base64) => {
    const tempUri = `${FileSystem.cacheDirectory}temp_image.png`;
    await FileSystem.writeAsStringAsync(tempUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return tempUri;
  };
  const deleteTempImage = async (tempUri) => {
    await FileSystem.deleteAsync(tempUri);
  };
  const extractMineralData = (tableData: string[][]): { Q: number; A: number; P: number } => {
    let Q = 0,
      A = 0,
      P = 0;
  
    tableData.forEach((row) => {
      if (row[0] === "Cuarzo") Q = parseFloat(row[5]) || 0; // Porcentaje de Cuarzo (Q)
      if (row[0] === "Feldespato") A = parseFloat(row[5]) || 0; // Porcentaje de Feldespato (A)
      if (row[0] === "Plagioclasa") P = parseFloat(row[5]) || 0; // Porcentaje de Plagioclasa (P)
    });
  
    return { Q, A, P };
  };

  const normalizeData = (Q: number, A: number, P: number): { Q: number; A: number; P: number } => {
    const total = Q + A + P;
    const factor = 100 / total;

    return {
      Q: Q * factor,
      A: A * factor,
      P: P * factor,
    };
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

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      // Guardar automáticamente al salir de la pantalla
      handleSaveReport();
    });
  
    return unsubscribe;
  }, [navigation, handleSaveReport]);
  const requestPermissions = async () => {
    const result = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    const status = result.granted ? 'granted' : 'denied';
    if (status !== 'granted') {
      alert('Se necesitan permisos para guardar el PDF.');
      return null;
    }
    return status;
  };
  const handleTakePhoto = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== "granted") {
      alert("Se necesitan permisos para acceder a la cámara.");
      return;
    }
  
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== "granted") {
      alert("Se necesitan permisos para acceder a la ubicación.");
      return;
    }
  
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled) {
      try {
        const location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
      } catch (error) {
        console.error("Error al obtener la ubicación:", error);
        alert("No se pudo obtener la ubicación. Asegúrate de que los servicios de ubicación estén activados.");
      }
  
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

  const generateHTMLContent = (type, title, dynamicTextsValues, tableData, photoBase64, diagramBase64, latitude, longitude, mineralData, text2) => {
    const commonStyles = `
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        padding: 20px;
        background-color: #f9f9f9;
      }
      h1 {
        color: #333;
        text-align: center;
        margin-bottom: 20px;
      }
      h2 {
        color: #555;
        margin-top: 20px;
        margin-bottom: 10px;
      }
      p {
        color: #666;
        margin-bottom: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
        color: #333;
      }
      img {
        max-width: 100%;
        height: auto;
        margin: 20px 0; /* Agregar margen superior e inferior */
        border: 1px solid #ddd;
        border-radius: 4px;
        display: block; /* Asegurar que la imagen no tenga espacio extra alrededor */
      }
      .section {
        margin-bottom: 30px;
      }
      .image-container {
        margin: 20px 0; /* Espacio adicional para el contenedor de la imagen */
        text-align: center; /* Centrar la imagen */
      }
    </style>
  `;
  
    let htmlContent = `
      <html>
        <head>
          ${commonStyles}
        </head>
        <body>
          <h1>Reporte de ${type === "free" ? "Libre" : `Roca ${type}`}: ${title}</h1>
    `;
  
    if (type !== "free") {
      htmlContent += `
        <div class="section">
          <h2>Datos Generales</h2>
          ${dynamicTexts[type].map((label, index) => `
            <p><strong>${label}:</strong> ${dynamicTextsValues[index]}</p>
          `).join("")}
        </div>
      `;
    }
  
    if (type === "igneous" && mineralData) {
      let rockType = "";
      const { Q, A, P } = mineralData;
      if (Q > 90) rockType = "Granito";
      else if (Q > 20 && A > 65) rockType = "Sienita";
      else if (Q > 20 && P > 65) rockType = "Diorita";
      else if (Q > 20 && A > 10 && P > 10) rockType = "Granodiorita";
      else if (Q > 20 && A < 10 && P < 10) rockType = "Tonalita";
      else rockType = "Roca no clasificada";
  
      htmlContent += `
        <div class="section">
          <h2>Diagrama de Streckeisen</h2>
          <p><strong>Tipo de Roca:</strong> ${rockType}</p>
          <p>Cuarzo (Q): ${Q.toFixed(1)}%</p>
          <p>Feldespato (A): ${A.toFixed(1)}%</p>
          <p>Plagioclasa (P): ${P.toFixed(1)}%</p>
          ${diagramBase64 ? `<img src="${diagramBase64}" />` : ""}
        </div>
      `;
    }
  
    htmlContent += `
      <div class="section">
        <h2>Tabla de Datos</h2>
        <table>
          ${tableData.map((row) => `
            <tr>
              ${row.map((cell) => `<td>${cell}</td>`).join("")}
            </tr>
          `).join("")}
        </table>
      </div>
    `;
  
    if (photoBase64) {
      htmlContent += `
        <div class="section">
          <h2>Foto</h2>
          <img src="${photoBase64}" />
          <p><strong>Coordenadas:</strong> Latitud: ${latitude.toFixed(6)}, Longitud: ${longitude.toFixed(6)}</p>
        </div>
      `;
    }
  
    if (type === "free") {
      htmlContent += `
        <div class="section">
          <h2>Texto Libre</h2>
          <p>${text2}</p>
        </div>
      `;
    }
  
    htmlContent += `
        </body>
      </html>
    `;
  
    return htmlContent;
  };

  const generatePDF = async () => {
    // Capturar el diagrama como imagen (solo para roca ígnea)
    let diagramBase64 = "";
    if (type === "igneous" && mineralData && viewShotRef.current) {
      diagramBase64 = await captureDiagram(viewShotRef);
    }
  
    // Convertir la foto a base64 (con redimensionamiento)
    let photoBase64 = "";
    if (photoUri) {
      photoBase64 = await getPhotoBase64(photoUri);
    }
  
    // Generar el contenido HTML del PDF
    const htmlContent = generateHTMLContent(
      type,
      title,
      dynamicTextsValues,
      tableData,
      photoBase64,
      diagramBase64,
      latitude,
      longitude,
      mineralData,
      text2
    );
  
    try {
      // Generar el PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 595,  // Ancho en puntos (A4)
        height: 842, // Alto en puntos (A4)
        base64: false,
      });
  
      // Guardar el PDF en el almacenamiento
      const permissions = await requestPermissions();
      if (!permissions) return;
  
      const folderName = "Reportes";
      const folderPath = `${FileSystem.documentDirectory}${folderName}/`;
      const folderInfo = await FileSystem.getInfoAsync(folderPath);
  
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
      }
  
      const now = new Date();
      const formattedDate = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
      const pdfName = `Reporte_${title}_${formattedDate}.pdf`;
      const pdfPath = `${folderPath}${pdfName}`;
  
      await FileSystem.moveAsync({ from: uri, to: pdfPath });
  
      // Compartir el PDF
      await Sharing.shareAsync(pdfPath);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert("Error al generar el PDF. Por favor, inténtalo de nuevo.");
    }
  };
  const StreckeisenDiagram = ({ Q, A, P }: { Q: number; A: number; P: number }) => {
    const width = 300;
    const height = 260;
    const padding = 20;
  
    // Coordenadas del triángulo
    const trianglePoints = [
      { x: width / 2, y: padding }, // Q (esquina superior)
      { x: padding, y: height - padding }, // A (esquina inferior izquierda)
      { x: width - padding, y: height - padding }, // P (esquina inferior derecha)
    ];
  
    // Calcular las coordenadas del punto (Q, A, P)
    const total = Q + A + P;
    const x = ((A + 0.5 * P) / total) * (width - 2 * padding) + padding;
    const y = height - padding - ((Q / total) * (height - 2 * padding));
  
    // Determinar el tipo de roca
    let rockType = "";
    if (Q > 90) rockType = "Granito";
    else if (Q > 20 && A > 65) rockType = "Sienita";
    else if (Q > 20 && P > 65) rockType = "Diorita";
    else if (Q > 20 && A > 10 && P > 10) rockType = "Granodiorita";
    else if (Q > 20 && A < 10 && P < 10) rockType = "Tonalita";
    else rockType = "Roca no clasificada";
  
    return (
      <Svg width={width} height={height}>
        {/* Dibujar el triángulo */}
        <Polygon
          points={`${trianglePoints[0].x},${trianglePoints[0].y} ${trianglePoints[1].x},${trianglePoints[1].y} ${trianglePoints[2].x},${trianglePoints[2].y}`}
          fill="none"
          stroke="black"
        />
  
        {/* Etiquetas de porcentaje en los bordes */}
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((percent) => {
          // Calcular las coordenadas para las etiquetas en los bordes
          const qX = width / 2;
          const qY = padding + ((percent / 100) * (height - 2 * padding));
          const aX = padding + ((percent / 100) * (width - 2 * padding));
          const aY = height - padding;
          const pX = width - padding - ((percent / 100) * (width - 2 * padding));
          const pY = height - padding;
  
          return (
            <React.Fragment key={percent}>
              {/* Etiquetas en el borde Q-A */}
              <SvgText x={aX - 20} y={aY + 15} fill="black" fontSize={10}>
                {percent}%
              </SvgText>
  
              {/* Etiquetas en el borde Q-P */}
              <SvgText x={pX + 5} y={pY + 15} fill="black" fontSize={10}>
                {percent}%
              </SvgText>
  
              {/* Etiquetas en el borde A-P */}
              <SvgText x={qX - 10} y={qY - 5} fill="black" fontSize={10}>
                {percent}%
              </SvgText>
            </React.Fragment>
          );
        })}
  
        {/* Dibujar el punto (Q, A, P) */}
        <Circle cx={x} cy={y} r={5} fill="red" />
  
        {/* Etiquetas de los vértices */}
        <SvgText x={trianglePoints[0].x - 10} y={trianglePoints[0].y - 10} fill="blue">
          Q: {Q.toFixed(1)}%
        </SvgText>
        <SvgText x={trianglePoints[1].x - 20} y={trianglePoints[1].y + 20} fill="green">
          A: {A.toFixed(1)}%
        </SvgText>
        <SvgText x={trianglePoints[2].x + 10} y={trianglePoints[2].y + 20} fill="red">
          P: {P.toFixed(1)}%
        </SvgText>
  
        {/* Mostrar el tipo de roca */}
        <SvgText x={x + 10} y={y + 10} fill="black" fontSize={12}>
          {rockType}
        </SvgText>
      </Svg>
    );
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
              setType(["sedimentary", "igneous", "metamorphic", "free"][(index as IndexPath).row] as "sedimentary" | "igneous" | "metamorphic" | "free");
            }}
            style={styles.input}
          >
            <SelectItem title="Roca Sedimentaria" />
            <SelectItem title="Roca Ígnea" />
            <SelectItem title="Roca Metamórfica" />
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

          {type === "igneous" && mineralData && (
          <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
            <Card style={styles.diagramCard}>
              <Text category="h6" style={styles.diagramTitle}>
                Diagrama de Streckeisen
              </Text>
              <StreckeisenDiagram Q={mineralData.Q} A={mineralData.A} P={mineralData.P} />
            </Card>
          </ViewShot>
          )}

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

          <Button onPress={generatePDF} style={styles.saveButton}>
            Exportar a PDF
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
  diagramCard: {
    marginBottom: 16,
  },
  diagramTitle: {
    marginBottom: 8,
  },
});

export default ReportsEditorScreen;