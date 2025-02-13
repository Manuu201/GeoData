import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { NavigationContainer } from "@react-navigation/native"
import { Icon, BottomNavigation, BottomNavigationTab, useTheme } from "@ui-kitten/components"
import { default as theme } from "./theme.json"
import * as eva from "@eva-design/eva"
import { EvaIconsPack } from "@ui-kitten/eva-icons"
import { ApplicationProvider, IconRegistry } from "@ui-kitten/components"

// Screen imports
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
import React from "react"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

const HomeIcon = (props) => <Icon {...props} name="home-outline" />
const TableIcon = (props) => <Icon {...props} name="grid-outline" />
const PhotoIcon = (props) => <Icon {...props} name="image-outline" />
const NoteIcon = (props) => <Icon {...props} name="edit-2-outline" />
const ReportIcon = (props) => <Icon {...props} name="file-text-outline" />

const BottomTabBar = ({ navigation, state }) => {
  const theme = useTheme()

  return (
    <BottomNavigation
      selectedIndex={state.index}
      onSelect={(index) => navigation.navigate(state.routeNames[index])}
      appearance="noIndicator"
      style={{
        backgroundColor: theme["background-basic-color-1"],
        borderTopWidth: 1,
        borderTopColor: theme["border-basic-color-3"],
      }}
    >
      <BottomNavigationTab title="Inicio" icon={HomeIcon} />
      <BottomNavigationTab title="Tablas" icon={TableIcon} />
      <BottomNavigationTab title="Fotos" icon={PhotoIcon} />
      <BottomNavigationTab title="Notas" icon={NoteIcon} />
      <BottomNavigationTab title="Informes" icon={ReportIcon} />
    </BottomNavigation>
  )
}

function TabNavigator() {
  return (
    <Tab.Navigator id={undefined} tabBar={(props) => <BottomTabBar {...props} />}>
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Tablas" component={TableScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Fotos" component={PhotosScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Notas" component={NotesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Informes" component={ReportsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  )
}

const AppNavigator = () => (
  <>
    <IconRegistry icons={EvaIconsPack} />
    <ApplicationProvider {...eva} theme={{ ...eva.light, ...theme }}>
      <NavigationContainer>
        <Stack.Navigator id={undefined}
          screenOptions={{
            headerStyle: {
              backgroundColor: theme["color-primary-500"],
            },
            headerTintColor: theme["color-basic-100"],
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="TableEditorScreen" component={TableEditorScreen} options={{ title: "Editar Tabla" }} />
          <Stack.Screen name="PdfViewerScreen" component={PdfViewerScreen} options={{ title: "Ver PDF" }} />
          <Stack.Screen name="NoteEditorScreen" component={NoteEditorScreen} options={{ title: "Editar Nota" }} />
          <Stack.Screen
            name="ReportsEditorScreen"
            component={ReportsEditorScreen}
            options={{ title: "Editar Informe" }}
          />
          <Stack.Screen name="OfflineMapScreen" component={OfflineMapScreen} options={{ title: "Ver Mapa" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ApplicationProvider>
  </>
)

export default AppNavigator

