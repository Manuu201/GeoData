import React from "react";
import { Button, StyleSheet, View } from "react-native";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as ImageManipulator from "expo-image-manipulator";

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
          margin-bottom: 20px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .section {
          margin-bottom: 30px;
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
          ${dynamicTexts.map((label, index) => `
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

    // Mostrar el texto libre en todos los casos si está presente
    if (text2) {
      const formattedText2 = text2.replace(/\n/g, "<br>"); // Reemplazar saltos de línea con <br>
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