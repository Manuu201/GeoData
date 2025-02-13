"use client"

import { useState } from "react"
import { FlatList, StyleSheet } from "react-native"
import { Button, Card, Input, Modal, Text, Icon, Select, SelectItem, IndexPath } from "@ui-kitten/components"
import type { TableEntity } from "../database/database"
import React from "react"

interface TableSelectionDialogProps {
  visible: boolean
  onDismiss: () => void
  tables: TableEntity[]
  onSelectTable: (table: TableEntity) => void
}

export default function TableSelectionDialog({ visible, onDismiss, tables, onSelectTable }: TableSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSortIndex, setSelectedSortIndex] = useState(new IndexPath(0))

  const sortOptions = ["ID", "Nombre", "Fecha"]
  const sortBy = sortOptions[selectedSortIndex.row]

  // Filtrar y ordenar tablas
  const filteredTables = tables
    .filter((table) => table.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "ID") return a.id - b.id
      if (sortBy === "Nombre") return a.name.localeCompare(b.name)
      if (sortBy === "Fecha") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return 0
    })

  return (
    <Modal visible={visible} backdropStyle={styles.backdrop} onBackdropPress={onDismiss}>
      <Card disabled={true} style={styles.dialog}>
        <Text category="h5" style={styles.title}>
          Seleccionar Tabla
        </Text>
        <Input
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessoryLeft={(props) => <Icon {...props} name="search-outline" />}
          style={styles.searchInput}
        />
        <Select
          selectedIndex={selectedSortIndex}
          onSelect={(index) => setSelectedSortIndex(index as IndexPath)}
          style={styles.select}
          value={`Ordenar por: ${sortBy}`}
        >
          {sortOptions.map((option, index) => (
            <SelectItem key={index} title={option} />
          ))}
        </Select>
        <FlatList
          data={filteredTables}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => onSelectTable(item)} status="basic">
              <Text category="s1">{item.name}</Text>
              <Text appearance="hint">{`Filas: ${item.rows}, Columnas: ${item.columns}`}</Text>
              <Text appearance="hint">{`Creada el: ${new Date(item.created_at).toLocaleDateString()}`}</Text>
            </Card>
          )}
          keyExtractor={(item) => `table-${item.id}`}
          numColumns={2}
        />
        <Button onPress={onDismiss} style={styles.closeButton} status="danger">
          Cerrar
        </Button>
      </Card>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dialog: {
    width: "90%",
    padding: 20,
    borderRadius: 10,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
  },
  searchInput: {
    marginBottom: 10,
  },
  select: {
    marginBottom: 10,
  },
  card: {
    flex: 1,
    margin: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F7F9FC",
    elevation: 3,
  },
  closeButton: {
    marginTop: 10,
    alignSelf: "center",
    width: "100%",
  },
})

