import React from "react";
import { Dialog, Button } from "react-native-paper";
import { FlatList } from "react-native";
import { TableEntity } from "../database/database";

interface TableSelectionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  tables: TableEntity[];
  onSelectTable: (table: TableEntity) => void;
}

export default function TableSelectionDialog({
  visible,
  onDismiss,
  tables,
  onSelectTable,
}: TableSelectionDialogProps) {
  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Seleccionar Tabla</Dialog.Title>
      <Dialog.Content>
        <FlatList
          data={tables}
          renderItem={({ item }) => (
            <Button mode="outlined" onPress={() => onSelectTable(item)} style={{ margin: 8 }} icon="table">
              {item.name}
            </Button>
          )}
          keyExtractor={(item) => `table-${item.id}`}
          numColumns={2}
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cerrar</Button>
      </Dialog.Actions>
    </Dialog>
  );
}