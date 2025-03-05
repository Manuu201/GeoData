import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Card, Icon, Text } from "@ui-kitten/components";
import { TableEntity } from "../database/database";


/**
 * Props para el componente TableComponent.
 * 
 * @property {TableEntity | undefined} table - Los datos de la tabla que se mostrarán. Si es `undefined`, se mostrará un mensaje indicando que no se ha cargado la tabla.
 * @property {() => void} onDelete - Función que se ejecuta cuando se presiona el botón de eliminar.
 */

interface TableComponentProps {
  table: TableEntity | undefined;
  onDelete: () => void;
}

/**
 * Componente que muestra una tabla de datos con opción para eliminarla.
 * 
 * @param {TableComponentProps} props - Las propiedades del componente.
 * @returns {JSX.Element} - El componente renderizado.
 */
export default function TableComponent({ table, onDelete }: TableComponentProps) {
  console.log("Table data:", table);

  if (!table) {
    return (
      <View style={styles.noTableContainer}>
        <Icon name="alert-circle-outline" fill="#8F9BB3" style={styles.noTableIcon} />
        <Text appearance="hint">No se ha cargado la tabla.</Text>
      </View>
    );
  }

  return (
    <Card style={styles.card}>
      <Text category="h6" style={styles.title}>
        {table.name}
      </Text>
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
      <Button
        status="danger"
        appearance="outline"
        accessoryLeft={(props) => <Icon {...props} name="trash-2-outline" />}
        onPress={onDelete}
        style={styles.deleteButton}
      >
        Eliminar
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  table: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E9F2",
    backgroundColor: "#F7F9FC",
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },
  cell: {
    flex: 1,
    padding: 10,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#E4E9F2",
  },
  deleteButton: {
    marginTop: 15,
    alignSelf: "center",
  },
  noTableContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noTableIcon: {
    width: 32,
    height: 32,
    marginBottom: 5,
  },
});
