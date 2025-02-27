import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Button, Icon, Input, Text } from "@ui-kitten/components";

const TableEditor = ({ tableData, setTableData }) => {
  const handleTableChange = (rowIndex, colIndex, value) => {
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

  return (
    <View style={styles.tableCard}>
      <Text category="h6" style={styles.tableTitle}>
        Tabla de Datos
      </Text>
      <View style={styles.tableControls}>
        <Button size="small" onPress={addRow} accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}>
          Fila
        </Button>
        <Button size="small" onPress={removeRow} accessoryLeft={(props) => <Icon {...props} name="minus-outline" />}>
          Fila
        </Button>
        <Button size="small" onPress={addColumn} accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}>
          Columna
        </Button>
        <Button size="small" onPress={removeColumn} accessoryLeft={(props) => <Icon {...props} name="minus-outline" />}>
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
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default TableEditor;