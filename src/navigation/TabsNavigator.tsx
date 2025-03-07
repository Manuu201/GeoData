import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { Icon, BottomNavigation, BottomNavigationTab, useTheme } from "@ui-kitten/components";
import { default as theme } from "./theme.json";
import * as eva from "@eva-design/eva";
import { EvaIconsPack } from "@ui-kitten/eva-icons";
import { ApplicationProvider, IconRegistry } from "@ui-kitten/components";
import { Alert } from "react-native";

// Screen imports
import HomeScreen from "../screens/HomeScreen";
import TableScreen from "../screens/Tables/TableScreen";
import PhotosScreen from "../screens/Photos/PhotosScreen";
import NotesScreen from "../screens/Notes/NotesScreen";
import TableEditorScreen from "../screens/Tables/TableEditorScreen";
import NoteEditorScreen from "../screens/Notes/NoteEditorScreen";
import ReportsScreen from "../screens/Reports/ReportsScreen";
import ReportsEditorScreen from "../screens/Reports/ReportsEditorScreen";
import StructuralDataScreen from "../screens/StructuralDatas/StructuralDataScreen";
import PhotoSelectorScreen from "../screens/StructuralDatas/PhotoSelectorScreen";
import LithologyListScreen from "../screens/Litologic/LithologyListScreen";
import LithologyFormScreen from "../screens/Litologic/LithologyFormScreen";
import CreateColumnScreen from "../screens/Litologic/CreateColumnScreen";
import HubScreen from "../screens/HubScreen";
import SettingScreen from "../screens/SettingsScreen";
import { useTerrain } from "../context/TerrainContext"; // Importa el contexto del terreno

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Iconos personalizados
const HomeIcon = (props) => <Icon {...props} name="home-outline" />;
const TableIcon = (props) => <Icon {...props} name="grid-outline" />;
const PhotoIcon = (props) => <Icon {...props} name="camera-outline" />;
const NoteIcon = (props) => <Icon {...props} name="edit-2-outline" />;
const ReportIcon = (props) => <Icon {...props} name="file-text-outline" />;
const StructureIcon = (props) => <Icon {...props} name="layers-outline" />;
const LithologyIcon = (props) => <Icon {...props} name="map-outline" />;

// Componente BottomTabBar personalizado
const BottomTabBar = ({ navigation, state }) => {
  const theme = useTheme();
  const { terrainId } = useTerrain(); // Obtén el terreno seleccionado del contexto

  return (
    <BottomNavigation
      selectedIndex={state.index}
      onSelect={(index) => {
        const routeName = state.routeNames[index];

        // Bloquear la navegación si no hay un terreno seleccionado y no es la pantalla "Inicio"
        if (routeName !== "Inicio" && !terrainId) {
          Alert.alert(
            "⚠️ Selecciona un Terreno",
            "Para continuar, primero debes seleccionar un terreno desde el selector en la parte superior.",
            [
              {
                text: "OK",
                onPress: () => console.log("OK Pressed"),
                style: "default",
              },
            ],
            { cancelable: false }
          );
          return;
        }
        navigation.navigate(routeName);
      }}
      appearance="noIndicator"
      style={{
        backgroundColor: theme["background-basic-color-1"],
        borderTopWidth: 1,
        borderTopColor: theme["border-basic-color-3"],
      }}
    >
      <BottomNavigationTab title="Inicio" icon={HomeIcon} />
      <BottomNavigationTab
        title="Tablas"
        icon={TableIcon}
        disabled={!terrainId} // Deshabilitar visualmente el tab si no hay un terreno seleccionado
        style={!terrainId ? { opacity: 0.5 } : null} // Estilo visual para tabs bloqueados
      />
      <BottomNavigationTab
        title="Fotos"
        icon={PhotoIcon}
        disabled={!terrainId}
        style={!terrainId ? { opacity: 0.5 } : null}
      />
      <BottomNavigationTab
        title="Notas"
        icon={NoteIcon}
        disabled={!terrainId}
        style={!terrainId ? { opacity: 0.5 } : null}
      />
      <BottomNavigationTab
        title="Datos"
        icon={StructureIcon}
        disabled={!terrainId}
        style={!terrainId ? { opacity: 0.5 } : null}
      />
      <BottomNavigationTab
        title="Columna"
        icon={LithologyIcon}
        disabled={!terrainId}
        style={!terrainId ? { opacity: 0.5 } : null}
      />
      <BottomNavigationTab
        title="Descripción"
        icon={ReportIcon}
        disabled={!terrainId}
        style={!terrainId ? { opacity: 0.5 } : null}
      />
    </BottomNavigation>
  );
};

// Componente TabNavigator
function TabNavigator() {
  return (
    <Tab.Navigator id={undefined} tabBar={(props) => <BottomTabBar {...props} />}>
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Tablas" component={TableScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Fotos" component={PhotosScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Notas" component={NotesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Datos" component={PhotoSelectorScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Columna" component={LithologyListScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Descripción" component={ReportsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// Componente AppNavigator
const AppNavigator = () => (
  <>
    <IconRegistry icons={EvaIconsPack} />
    <ApplicationProvider {...eva} theme={{ ...eva.light, ...theme }}>
      <NavigationContainer>
        <Stack.Navigator
          id={undefined}
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
          <Stack.Screen name="NoteEditorScreen" component={NoteEditorScreen} options={{ title: "Editar Nota" }} />
          <Stack.Screen
            name="ReportsEditorScreen"
            component={ReportsEditorScreen}
            options={{ title: "Editar Informe" }}
          />
          <Stack.Screen name="StructuralDataScreen" component={StructuralDataScreen} options={{ title: "Ver Datos Estructurales" }} />
          <Stack.Screen name="LithologyFormScreen" component={LithologyFormScreen} options={{ title: "Ver Columnas Estratigráfica" }} />
          <Stack.Screen name="CreateColumnScreen" component={CreateColumnScreen} options={{ title: "Crear Columnas Litologicas" }} />
          <Stack.Screen name="TableScreen" component={TableScreen} options={{ title: "Ver Tablas" }} />
          <Stack.Screen name="PhotosScreen" component={PhotosScreen} options={{ title: "Ver Fotos" }} />
          <Stack.Screen name="NotesScreen" component={NotesScreen} options={{ title: "Ver Notas" }} />
          <Stack.Screen name="PhotoSelectorScreen" component={PhotoSelectorScreen} options={{ title: "Ver Fotos Estructurales" }} />
          <Stack.Screen name="LithologyListScreen" component={LithologyListScreen} options={{ title: "Ver Lista Litologica" }} />
          <Stack.Screen name="ReportsScreen" component={ReportsScreen} options={{ title: "Ver Reportes" }} />
          <Stack.Screen name="SettingsScreen" component={SettingScreen} options={{ title: "Ver Configuraciones" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ApplicationProvider>
  </>
);

export default AppNavigator;