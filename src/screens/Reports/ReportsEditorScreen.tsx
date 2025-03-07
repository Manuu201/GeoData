import React, { useState, useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Alert } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";
import { Layout, Button, useTheme, Select, SelectItem, IndexPath, Input } from "@ui-kitten/components";
import ReportForm from "../../components/Reports/ReportForm";
import TableEditor from "../../components/Reports/TableEditor";
import StreckeisenDiagram from "../../components/Reports/StreckeisenDiagram";
import PhotoSection from "../../components/Reports/PhotoSection";
import PDFGenerator from "../../components/Reports/PDFGenerator";
import { addReportAsync, updateReportAsync, type ReportEntity } from "../../database/database";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import ViewShot from "react-native-view-shot";
import { useTerrain } from "../../context/TerrainContext"; // Importar el contexto del terreno

type ReportsEditorScreenProps = NativeStackScreenProps<RootStackParamList, "ReportsEditorScreen">;

// Definir textos dinámicos para cada tipo de reporte
const dynamicTexts = {
  sedimentary: [
    "Codigo Muestra",
    "Nombre Roca",
    "Granulometría",
    "Matriz",
    "Cemento",
    "Grado de Selección",
    "Madurez Textural",
    "Madurez Composicional",
    "Estructura Sedimentaria",
    "Ambiente de Depósito",
  ],
  igneous: [
    "Codigo Muestra",
    "Nombre Roca (QAP)",
    "Textura",
    "Estructura",
    "Fábrica",
    "Grado de Cristalinidad",
    "Tamaño de Grano",
    "Morfología Especial",
    "Índice de Color",
  ],
  metamorphic: [
    "Codigo Muestra",
    "Nombre Roca",
    "Fábrica",
    "Estructura",
    "Textura",
    "Tipo de Foliación",
    "Protolito",
    "Tipo de Metamorfismo",
    "Zona o Facie",
    "Grado",
  ],
  sedimentaryChemistry: [
    "Codigo Muestra",
    "Nombre Roca",
    "Textura",
    "Estructura Sedimentaria",
    "Fábrica",
    "Composición Mineralogica",
    "Color",
    "Cemento",
    "Reacción con HCl",
    "Ambiente de Formación",
  ],
  pyroclastic: [
    "Codigo Muestra",
    "Nombre de Roca",
    "Estructura",
    "Textura Piroclastica",
    "Tamaño Dominante",
    "Grado de Soldura",
    "Color",
    "Fabrica",
    "Porosidad",
  ],
  free: [],
};

// Plantillas predefinidas para las tablas de cada tipo de reporte
const predefinedTemplates = {
  sedimentary: [
    ["", "Tipo", "Porcentaje"],
    ["Minerales", "", ""],
    ["Fósiles", "", ""],
    ["Cemento", "", ""],
    ["Matriz", "", ""],
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
  sedimentaryChemistry: [
    ["", "Tipo", "Porcentaje"],
    ["Minerales", "", ""],
    ["Fósiles", "", ""],
    ["Cemento", "", ""],
    ["Matriz", "", ""],
  ],
  pyroclastic: [
    ["Tipo Piroclastico", "Porcentaje", "Tamaño", "Forma", "Composicion", "Color"],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""]
  ],
  free: Array.from({ length: 5 }, () => Array(5).fill("")), // Inicialización corregida
};

/**
 * Pantalla de edición de reportes que permite al usuario crear o editar un reporte,
 * agregar datos dinámicos, tablas, fotos y generar un PDF.
 * 
 * @param {ReportsEditorScreenProps} props - Propiedades de la pantalla.
 * @returns {JSX.Element} - El componente de la pantalla de edición de reportes.
 */
const ReportsEditorScreen: React.FC<ReportsEditorScreenProps> = ({ navigation, route }) => {
  const { report } = route.params || {};
  const [title, setTitle] = useState(report?.title || "");
  const [type, setType] = useState<"sedimentary" | "igneous" | "metamorphic"  | 'free' | 'sedimentaryChemistry' | 'pyroclastic'>(report?.type || "sedimentary");
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
  const { terrainId } = useTerrain(); // Obtener el terreno seleccionado
  const theme = useTheme();

  // Efecto para cargar los valores dinámicos y la tabla según el tipo de reporte
  useEffect(() => {
    setDynamicTextsValues(dynamicTexts[type].map((_, i) => (report?.text1 ? JSON.parse(report.text1)[i] || "" : "")));
    setTableData(predefinedTemplates[type]);
  }, [type, report?.text1]);

  // Efecto para calcular los datos minerales si el tipo es "igneous"
  useEffect(() => {
    if (type === "igneous") {
      const { Q, A, P } = extractMineralData(tableData);
      const normalizedData = normalizeData(Q, A, P);
      setMineralData(normalizedData);
    } else {
      setMineralData(null);
    }
  }, [tableData, type]);

  // Efecto para cargar los datos del reporte si existe
  useEffect(() => {
    const loadReportData = async () => {
      if (report) {
        setTitle(report.title);
        setType(report.type);
        setPhotoUri(report.photoUri);
        setLatitude(report.latitude);
        setLongitude(report.longitude);
        setText2(report.text2);
        setDynamicTextsValues(report.text1 ? JSON.parse(report.text1) : []);
        setTableData(report.tableData ? JSON.parse(report.tableData) : []);
      } else {
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

  /**
   * Extrae los datos minerales de la tabla.
   * 
   * @param {string[][]} tableData - Datos de la tabla.
   * @returns {Object} - Datos minerales { Q, A, P }.
   */
  const extractMineralData = (tableData: string[][]): { Q: number; A: number; P: number } => {
    let Q = 0,
      A = 0,
      P = 0;

    tableData.forEach((row) => {
      if (row[0] === "Cuarzo") Q = parseFloat(row[5]) || 0;
      if (row[0] === "Feldespato") A = parseFloat(row[5]) || 0;
      if (row[0] === "Plagioclasa") P = parseFloat(row[5]) || 0;
    });

    return { Q, A, P };
  };

  /**
   * Normaliza los datos minerales para que sumen 100.
   * 
   * @param {number} Q - Porcentaje de Cuarzo.
   * @param {number} A - Porcentaje de Feldespato.
   * @param {number} P - Porcentaje de Plagioclasa.
   * @returns {Object} - Datos normalizados { Q, A, P }.
   */
  const normalizeData = (Q: number, A: number, P: number): { Q: number; A: number; P: number } => {
    const total = Q + A + P;
    const factor = 100 / total;

    return {
      Q: Q * factor,
      A: A * factor,
      P: P * factor,
    };
  };

  /**
   * Maneja el cambio de tipo de reporte.
   * 
   * @param {IndexPath | IndexPath[]} index - Índice del tipo seleccionado.
   */
  const handleTypeChange = (index: IndexPath | IndexPath[]) => {
    const selectedIndex = Array.isArray(index) ? index[0] : index;
    setSelectedTypeIndex(selectedIndex);
    const newType = ["sedimentary", "igneous", "metamorphic", "free", "sedimentaryChemistry","pyroclastic"][selectedIndex.row] as
      | "sedimentary"
      | "igneous"
      | "metamorphic"
      | "free"
      | "sedimentaryChemistry"
      | "pyroclastic";
    setType(newType);
  };

  /**
   * Guarda el reporte en la base de datos.
   */
  const handleSaveReport = async () => {
    if (!terrainId) {
      Alert.alert("Error", "Debes seleccionar un terreno antes de guardar un reporte.");
      return;
    }

    const now = new Date().toISOString();
    const newReport: Omit<ReportEntity, "id" | "createdAt" | "updatedAt"> = {
      terrainId, // Asociar el reporte al terreno seleccionado
      type: type as 'sedimentary' | 'igneous' | 'metamorphic' | 'free' | 'sedimentaryChemistry' | 'pyroclastic',
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
          <ReportForm
            title={title}
            setTitle={setTitle}
            type={type}
            setType={setType}
            dynamicTexts={dynamicTexts[type]}
            dynamicTextsValues={dynamicTextsValues}
            setDynamicTextsValues={setDynamicTextsValues}
            text2={text2}
            setText2={setText2}
          />
          <TableEditor tableData={tableData} setTableData={setTableData} />
          {type === "igneous" && mineralData && (
            <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
              <StreckeisenDiagram Q={mineralData.Q} A={mineralData.A} P={mineralData.P} />
            </ViewShot>
          )}
          <PhotoSection
            photoUri={photoUri}
            setPhotoUri={setPhotoUri}
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
          />
          <Button onPress={handleSaveReport} style={styles.saveButton}>
            Guardar Reporte
          </Button>
          <PDFGenerator
            type={type}
            title={title}
            dynamicTexts={dynamicTexts[type]}
            dynamicTextsValues={dynamicTextsValues}
            tableData={tableData}
            photoUri={photoUri}
            latitude={latitude}
            longitude={longitude}
            mineralData={mineralData}
            text2={text2}
            viewShotRef={viewShotRef}
          />
        </Layout>
      </ScrollView>
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
  saveButton: {
    marginTop: 16,
  },
});

export default ReportsEditorScreen;