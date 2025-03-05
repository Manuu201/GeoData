import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Button, Icon, Input, Text } from "@ui-kitten/components";

/**
 * Componente que permite editar una tabla de datos dinámica.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Array<Array<string>>} props.tableData - Datos de la tabla.
 * @param {Function} props.setTableData - Función para actualizar los datos de la tabla.
 * @returns {JSX.Element} - El componente renderizado.
 */
const TableEditor = ({ tableData, setTableData }) => {
  /**
   * Maneja el cambio de valor en una celda de la tabla.
   * 
   * @param {number} rowIndex - Índice de la fila.
   * @param {number} colIndex - Índice de la columna.
   * @param {string} value - Nuevo valor de la celda.
   */
  const handleTableChange = (rowIndex, colIndex, value) => {
    const newRows = [...tableData];
    newRows[rowIndex][colIndex] = value;
    setTableData(newRows);
  };

  /**
   * Agrega una nueva fila a la tabla.
   */
  const addRow = () => {
    setTableData([...tableData, Array(tableData[0]?.length || 5).fill("")]);
  };

  /**
   * Elimina la última fila de la tabla.
   */
  const removeRow = () => {
    if (tableData.length > 1) setTableData(tableData.slice(0, -1));
  };

  /**
   * Agrega una nueva columna a la tabla.
   */
  const addColumn = () => {
    setTableData(tableData.map((row) => [...row, ""]));
  };

  /**
   * Elimina la última columna de la tabla.
   */
  const removeColumn = () => {
    if (tableData[0]?.length > 1) setTableData(tableData.map((row) => row.slice(0, -1)));
  };

  return (
    <View style={styles.tableCard}>
      {/* Título de la tabla */}
      <Text category="h6" style={styles.tableTitle}>
        Tabla de Datos
      </Text>

      {/* Controles para agregar/eliminar filas y columnas */}
      <View style={styles.tableControls}>
        <View style={styles.buttonGroup}>
          <Button size="small" onPress={addRow} accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}>
            Fila
          </Button>
          <Button size="small" onPress={removeRow} accessoryLeft={(props) => <Icon {...props} name="minus-outline" />}>
            Fila
          </Button>
        </View>
        <View style={styles.buttonGroup}>
          <Button size="small" onPress={addColumn} accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}>
            Columna
          </Button>
          <Button size="small" onPress={removeColumn} accessoryLeft={(props) => <Icon {...props} name="minus-outline" />}>
            Columna
          </Button>
        </View>
      </View>

      {/* Contenedor de la tabla con scroll horizontal */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.tableContainer}>
          {tableData.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.tableRow, rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow]}>
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
    </View>
  );
};

// Estilos del componente
const styles = StyleSheet.create({
  tableCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  tableControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E4E9F2",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },
  evenRow: {
    backgroundColor: "#F7F9FC",
  },
  oddRow: {
    backgroundColor: "#FFFFFF",
  },
  tableCell: {
    width: 150, // Ancho de las celdas
    height: 60, // Altura de las celdas
    margin: 2,
    padding: 12, // Espaciado interno
    borderWidth: 1,
    borderColor: "#E4E9F2",
    borderRadius: 4,
    backgroundColor: "transparent", // Fondo transparente para que se vea el color de la fila
  },
});

export default TableEditor;