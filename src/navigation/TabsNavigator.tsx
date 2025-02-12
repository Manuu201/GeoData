import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { NavigationContainer } from "@react-navigation/native"
import { PaperProvider, MD3LightTheme as DefaultTheme } from "react-native-paper"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import HomeScreen from "../screens/HomeScreen"
import TableScreen from "../screens/Tables/TableScreen"
import PhotosScreen from "../screens/Photos/PhotosScreen"
import NotesScreen from "../screens/Notes/NotesScreen"
import TableEditorScreen from "../screens/Tables/TableEditorScreen"
import PdfViewerScreen from "../components/PdfViewerScreen"
import NoteEditorScreen from "../screens/Notes/NoteEditorScreen"
import ReportsScreen from "../screens/Reports/ReportsScreen"
import OfflineMapScreen from "../components/OfflineMapScreen"
import ReportsEditorScreen from "../screens/Reports/ReportsEditorScreen"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#3498db",
    secondary: "#2ecc71",
    background: "#f8f9fa",
    surface: "#ffffff",
    text: "#2c3e50",
    accent: "#e74c3c",
  },
  roundness: 12,
}

function TabNavigator() {
  return (
    <Tab.Navigator id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#95a5a6",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          let iconName

          if (route.name === "Inicio") iconName = "home"
          else if (route.name === "Tablas") iconName = "table-large"
          else if (route.name === "Fotos") iconName = "image"
          else if (route.name === "Notas") iconName = "notebook"
          else if (route.name === "Informes") iconName = "file-document"

          return <Icon name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Tablas" component={TableScreen} />
      <Tab.Screen name="Fotos" component={PhotosScreen} />
      <Tab.Screen name="Notas" component={NotesScreen} />
      <Tab.Screen name="Informes" component={ReportsScreen} />
    </Tab.Navigator>
  )
} 

export default function AppNavigator() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator id={undefined}
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: theme.colors.surface,
            headerTitleStyle: { fontWeight: "bold" },
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="TableEditorScreen" component={TableEditorScreen} options={{ title: "Editar Tabla" }} />
          <Stack.Screen name="PdfViewerScreen" component={PdfViewerScreen} options={{ title: "Ver PDF" }} />
          <Stack.Screen name="NoteEditorScreen" component={NoteEditorScreen} options={{ title: "Editar Nota" }} />
          <Stack.Screen name="ReportsEditorScreen" component={ReportsEditorScreen} options={{ title: "Editar Informe" }} />
          <Stack.Screen name="OfflineMapScreen" component={OfflineMapScreen} options={{ title: "Ver Mapa" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  )
}

