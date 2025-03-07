import React from "react";
import { Button, StyleSheet, View } from "react-native";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Props para el componente PDFGenerator.
 * 
 * @property {string} type - Tipo de reporte (por ejemplo, "igneous" o "free").
 * @property {string} title - Título del reporte.
 * @property {string[]} dynamicTexts - Etiquetas para los textos dinámicos.
 * @property {string[]} dynamicTextsValues - Valores correspondientes a los textos dinámicos.
 * @property {string[][]} tableData - Datos de la tabla que se incluirán en el PDF.
 * @property {string} photoUri - URI de la foto que se incluirá en el PDF.
 * @property {number} latitude - Latitud de la ubicación donde se tomó la foto.
 * @property {number} longitude - Longitud de la ubicación donde se tomó la foto.
 * @property {{ Q: number, A: number, P: number }} mineralData - Datos minerales para el diagrama de Streckeisen (solo para tipo "igneous").
 * @property {string} text2 - Texto libre que se incluirá en el PDF.
 * @property {React.RefObject} viewShotRef - Referencia para capturar un diagrama (solo para tipo "igneous").
 */

/**
 * Componente que genera un PDF con datos dinámicos, una tabla, una foto, coordenadas y texto libre.
 * 
 * @param {PDFGenerator} props - Las propiedades del componente.
 * @returns {JSX.Element} - El componente renderizado.
 */
const items = [
  { label: "Roca Sedimentaria Clasica", value: "sedimentary" },
  { label: "Roca Sedimentaria Quimica y Biogenica", value: "sedimentaryChemistry" },
  { label: "Roca Ígnea", value: "igneous" },
  { label: "Roca Metamórfica", value: "metamorphic" },
  { label: "Roca Piroclastica", value: "pyroclastic" },
  { label: "Libre", value: "free" },
];

const PDFGenerator = ({
  type,
  title,
  dynamicTexts,
  dynamicTextsValues,
  tableData,
  photoUri,
  latitude,
  longitude,
  mineralData,
  text2,
  viewShotRef,
}) => {
  const captureDiagram = async (ref) => {
    if (ref.current) {
      try {
        const uri = await ref.current.capture();
        const resizedUri = await resizeImage(uri);
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
      const resizedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      return resizedImage.uri;
    } catch (error) {
      console.error("Error al redimensionar la imagen:", error);
      return null;
    }
  };

  const getPhotoBase64 = async (uri) => {
    try {
      const resizedUri = await resizeImage(uri);
      if (!resizedUri) return null;
      const base64 = await FileSystem.readAsStringAsync(resizedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error("Error al convertir la foto a base64:", error);
      return null;
    }
  };

  const generateHTMLContent = async () => {
    let diagramBase64 = "";
    if (type === "igneous" && mineralData && viewShotRef.current) {
      diagramBase64 = await captureDiagram(viewShotRef);
    }

    let photoBase64 = "";
    if (photoUri) {
      photoBase64 = await getPhotoBase64(photoUri);
    }

    const now = new Date();
    const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    const commonStyles = `
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 20px;
          padding: 20px;
          background-color: #ffffff;
          color: #333;
        }
        h1 {
          color: #2c3e50;
          text-align: center;
          margin-bottom: 20px;
          font-size: 24px;
          font-weight: bold;
        }
        h2 {
          color: #34495e;
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 18px;
          font-weight: bold;
          border-bottom: 2px solid #3498db;
          padding-bottom: 5px;
        }
        p {
          color: #555;
          margin-bottom: 10px;
          line-height: 1.6;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          overflow: hidden;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #3498db;
          color: #fff;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        img {
          max-width: 100%;
          height: auto;
          margin-bottom: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .section {
          margin-bottom: 30px;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header p {
          color: #777;
          font-size: 14px;
        }
        .highlight {
          color: #e74c3c;
          font-weight: bold;
        }
      </style>
    `;

    let htmlContent = `
      <html>
        <head>
          ${commonStyles}
        </head>
        <body>
          <div class="header">
            <h1>Reporte de ${type === "free" ? "Libre" : items.find(item => item.value === type)?.label || type}: ${title}</h1>
            <p>Fecha de generación: <span class="highlight">${formattedDate}</span></p>
          </div>
    `;

    if (type !== "free") {
      htmlContent += `
        <div class="section">
          <h2>Datos Generales</h2>
          ${dynamicTexts.map((label, index) => `
            <p><strong>${label}:</strong> ${dynamicTextsValues[index]}</p>
          `).join("")}
        </div>
      `;
    }

    if (type === "igneous" && mineralData) {
      let rockType = "";
      const { Q, A, P } = mineralData;
    
      // Normalizar los valores de Q, A y P para que sumen 100%
      const total = Q + A + P;
      const normalizedQ = (Q / total) * 100;
      const normalizedA = (A / total) * 100;
      const normalizedP = (P / total) * 100;
    
      // Determinación del tipo de roca
      if (normalizedQ > 90) rockType = "Granitoides ricos en cuarzo";
      else if (normalizedQ > 60 && normalizedA > 20) rockType = "Granito Feld. Alcalinico (0-20)";
      else if (normalizedQ > 40 && normalizedA > 20) rockType = "Sienogranito (5-20) Monzogranito (5-20)";
      else if (normalizedQ > 20 && normalizedA > 20) rockType = "Granodiorita (5-25)";
      else if (normalizedQ > 10 && normalizedA > 10) rockType = "Tonalita (10-40) Trondhjemia (0-10)";
      else if (normalizedQ > 5 && normalizedA > 5) rockType = "Czo-Sienita Feld. Alcal. (0-25)";
      else if (normalizedQ > 5 && normalizedA > 5) rockType = "Czo-Sienita (5-30)";
      else if (normalizedQ > 10 && normalizedA > 10) rockType = "Czo-Monzonita (10-35)";
      else if (normalizedQ > 10 && normalizedA > 10) rockType = "Czo-Monzodiorita (10-35) Czo-Monzogabro (20-50)";
      else if (normalizedQ > 20 && normalizedA > 20) rockType = "Czo-Diorita (20-45) Czo-Gabro (25-65)";
      else rockType = "Roca no clasificada";
    
      htmlContent += `
        <div class="section">
          <h2>Diagrama de Streckeisen</h2>
          <p><strong>Tipo de Roca:</strong> <span class="highlight">${rockType}</span></p>
          <p>Cuarzo (Q): ${normalizedQ.toFixed(1)}%</p>
          <p>Feldespato (A): ${normalizedA.toFixed(1)}%</p>
          <p>Plagioclasa (P): ${normalizedP.toFixed(1)}%</p>
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

    if (text2) {
      const formattedText2 = text2.replace(/\n/g, "<br>");
      htmlContent += `
        <div class="section">
          <h2>Texto Libre</h2>
          <p>${formattedText2}</p>
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
    try {
      const htmlContent = await generateHTMLContent();
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 595,
        height: 842,
        base64: false,
      });

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
      await Sharing.shareAsync(pdfPath);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert("Error al generar el PDF. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <View style={styles.saveButton}>
      <Button onPress={generatePDF} title="Exportar a PDF" />
    </View>
  );
};

const styles = StyleSheet.create({
  saveButton: {
    marginTop: 16,
  },
});

export default PDFGenerator;