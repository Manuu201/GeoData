import React from "react"
import { useState, useCallback } from "react"
import { FlatList, View, StyleSheet } from "react-native"
import { useSQLiteContext } from "expo-sqlite"
import { fetchReportsAsync, deleteReportAsync, type ReportEntity } from "../../database/database"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../navigation/types"
import { useFocusEffect } from "@react-navigation/native"
import {
  Button,
  Layout,
  Input,
  Select,
  SelectItem,
  IndexPath,
  Text,
  Card,
  Modal,
  Icon,
  useTheme,
} from "@ui-kitten/components"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { FadeInRight, FadeOutLeft, Layout as LayoutAnimation } from "react-native-reanimated"

type ReportsScreenProps = NativeStackScreenProps<RootStackParamList, "ReportsScreen">

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [reports, setReports] = useState<ReportEntity[]>([])
  const [filter, setFilter] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<IndexPath>(new IndexPath(0))
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<ReportEntity | null>(null)
  const db = useSQLiteContext()
  const theme = useTheme()

  useFocusEffect(
    useCallback(() => {
      loadReports()
    }, []), // Removed unnecessary dependencies
  )

  const loadReports = async () => {
    const fetchedReports = await fetchReportsAsync(db)
    const filteredReports = fetchedReports.filter((report) => report.type.toLowerCase().includes(filter.toLowerCase()))
    const sortedReports = filteredReports.sort((a, b) => {
      switch (sortOrder.row) {
        case 0:
          return a.title.localeCompare(b.title)
        case 1:
          return b.title.localeCompare(a.title)
        case 2:
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 3:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
    setReports(sortedReports)
  }

  const handleEditReport = (report: ReportEntity) => {
    navigation.navigate("ReportsEditorScreen", { report })
  }

  const handleDeleteReport = async (id: number) => {
    await deleteReportAsync(db, id)
    setDeleteModalVisible(false)
    setReportToDelete(null)
    loadReports()
  }

  const renderReportItem = ({ item }: { item: ReportEntity }) => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} layout={LayoutAnimation.springify()}>
      <Card style={styles.reportItem}>
        <Text category="h6">{item.title}</Text>
        <Text category="s1">Tipo: {item.type}</Text>
        <Text category="s1">Fecha: {new Date(item.createdAt).toLocaleDateString()}</Text>
        <View style={styles.actions}>
          <Button size="small" status="info" onPress={() => handleEditReport(item)}>
            Editar
          </Button>
          <Button
            size="small"
            status="danger"
            onPress={() => {
              setReportToDelete(item)
              setDeleteModalVisible(true)
            }}
          >
            Eliminar
          </Button>
        </View>
      </Card>
    </Animated.View>
  )

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme["background-basic-color-1"] }]}>
      <Layout style={styles.container} level="1">
        <View style={styles.filtersContainer}>
          <Input
            placeholder="Filtrar por tipo de reporte"
            value={filter}
            onChangeText={setFilter}
            style={styles.input}
            accessoryLeft={(props) => <Icon {...props} name="search-outline" />}
          />
          <Select
            selectedIndex={sortOrder}
            onSelect={(index) => setSortOrder(index instanceof IndexPath ? index : index[0])}
            style={styles.select}
          >
            <SelectItem title="Nombre (A-Z)" accessoryLeft={(props) => <Icon {...props} name="arrow-down-outline" />} />
            <SelectItem title="Nombre (Z-A)" accessoryLeft={(props) => <Icon {...props} name="arrow-up-outline" />} />
            <SelectItem
              title="Fecha (Más antiguo)"
              accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
            />
            <SelectItem
              title="Fecha (Más reciente)"
              accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
            />
          </Select>
        </View>

        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
        />

        <Button
          style={styles.addButton}
          onPress={() => navigation.navigate("ReportsEditorScreen")}
          accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
        >
          Crear Reporte
        </Button>

        <Modal
          visible={deleteModalVisible}
          backdropStyle={styles.backdrop}
          onBackdropPress={() => setDeleteModalVisible(false)}
        >
          <Card disabled={true}>
            <Text category="h6" style={styles.modalText}>
              ¿Estás seguro de que quieres eliminar este reporte?
            </Text>
            <Text category="s1" style={styles.modalText}>
              {reportToDelete?.title}
            </Text>
            <View style={styles.modalActions}>
              <Button status="basic" onPress={() => setDeleteModalVisible(false)}>
                Cancelar
              </Button>
              <Button status="danger" onPress={() => reportToDelete && handleDeleteReport(reportToDelete.id)}>
                Eliminar
              </Button>
            </View>
          </Card>
        </Modal>
      </Layout>
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
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  input: {
    flex: 2,
    marginRight: 8,
  },
  select: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80,
  },
  reportItem: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  addButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    borderRadius: 28,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalText: {
    marginBottom: 12,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
})

export default ReportsScreen

