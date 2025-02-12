import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { TableEntity } from "../database/database";

interface TableComponentProps {
  table: TableEntity | undefined; // Aceptar `undefined`
  onDelete: () => void;
}

export default function TableComponent({ table, onDelete }: TableComponentProps) {
  console.log("Table data:", table); // Verifica el contenido de la tabla
  if (!table) {
    return <Text>No se ha cargado la tabla.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{table.name}</Text>
      <View style={styles.table}>
        {table.data.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, cellIndex) => (
              <Text key={cellIndex} style={styles.cell}>
                {cell}
              </Text>
            ))}
          </View>
        ))}
      </View>
      <Button onPress={onDelete} style={styles.deleteButton}>
        Eliminar
      </Button>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  deleteButton: {
    marginTop: 8,
  },
});