import { useState, useEffect, useCallback } from "react"
import { FlatList, StyleSheet } from "react-native"
import {
  Button,
  Layout,
  Text,
  Card,
  Input,
  Icon,
  TopNavigation,
  TopNavigationAction,
  Modal,
  Divider,
  useTheme,
} from "@ui-kitten/components"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import { useSQLiteContext } from "expo-sqlite"
import { fetchColumnsAsync, deleteColumnAsync, type LithologyColumnEntity } from "../../database/database"
import { SafeAreaView } from "react-native-safe-area-context"
import type { RootStackParamList } from "../../navigation/types"
import React from "react"

type LithologyListScreenNavigationProp = StackNavigationProp<RootStackParamList, "LithologyListScreen">

const LithologyListScreen = () => {
  const navigation = useNavigation<LithologyListScreenNavigationProp>()
  const theme = useTheme()
  const db = useSQLiteContext()
  const [columns, setColumns] = useState<LithologyColumnEntity[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortByDate, setSortByDate] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState<LithologyColumnEntity | null>(null)

  const loadColumns = useCallback(async () => {
    const fetchedColumns = await fetchColumnsAsync(db)
    if (sortByDate) {
      fetchedColumns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    setColumns(fetchedColumns)
  }, [db, sortByDate])

  useFocusEffect(
    useCallback(() => {
      loadColumns()
    }, [loadColumns]),
  )

  useEffect(() => {
    loadColumns()
  }, [loadColumns])

  const handleDelete = async (id: number) => {
    await deleteColumnAsync(db, id)
    setDeleteModalVisible(false)
    setColumnToDelete(null)
    loadColumns()
  }

  const filteredColumns = columns.filter((column) => column.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const renderItem = ({ item }: { item: LithologyColumnEntity }) => (
    <Card style={styles.item} onPress={() => navigation.navigate("LithologyFormScreen", { columnId: item.id })}>
      <Text category="h6">{item.name}</Text>
      <Text category="s1" appearance="hint">
        Created: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Button
        size="small"
        status="danger"
        style={styles.deleteButton}
        onPress={() => {
          setColumnToDelete(item)
          setDeleteModalVisible(true)
        }}
      >
        Delete
      </Button>
    </Card>
  )

  const SortIcon = (props) => <Icon {...props} name={sortByDate ? "calendar" : "calendar-outline"} />

  const AddIcon = (props) => <Icon {...props} name="plus-outline" />

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopNavigation
        title="Lithology Columns"
        alignment="center"
        accessoryRight={() => (
          <TopNavigationAction icon={AddIcon} onPress={() => navigation.navigate("CreateColumnScreen")} />
        )}
      />
      <Divider />
      <Layout style={styles.container} level="1">
        <Input
          placeholder="Buscar columnas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessoryLeft={(props) => <Icon {...props} name="search" />}
          style={styles.searchInput}
        />
        <Button
          appearance="ghost"
          status="basic"
          accessoryLeft={SortIcon}
          onPress={() => setSortByDate(!sortByDate)}
          style={styles.sortButton}
        >
          {sortByDate ? "Ordenado por fecha" : "Ordenar por fecha"}
        </Button>
        <FlatList
          data={filteredColumns}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      </Layout>

      <Modal
        visible={deleteModalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setDeleteModalVisible(false)}
      >
        <Card disabled={true}>
          <Text category="h6" style={styles.modalText}>
            Borrar Columna
          </Text>
          <Text style={styles.modalText}>¿Esta seguro que quiere borrar "{columnToDelete?.name}"?</Text>
          <Layout style={styles.modalButtonContainer}>
            <Button status="basic" onPress={() => setDeleteModalVisible(false)}>
              Cancelar
            </Button>
            <Button status="danger" onPress={() => columnToDelete && handleDelete(columnToDelete.id)}>
              Borrar
            </Button>
          </Layout>
        </Card>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    marginBottom: 16,
  },
  sortButton: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  item: {
    marginBottom: 16,
  },
  deleteButton: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalText: {
    marginBottom: 12,
    textAlign: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
})

export default LithologyListScreen

