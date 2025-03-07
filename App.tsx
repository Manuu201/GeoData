import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import * as eva from '@eva-design/eva';
import TabsNavigator from './src/navigation/TabsNavigator';
import { migrateDbIfNeeded } from './src/database/database';
import { useTheme } from './src/hooks/useTheme'; // Importa el hook useTheme
import { TerrainProvider } from './src/context/TerrainContext';

export default function App() {
  const { theme } = useTheme(); // Usa el hook para obtener el tema actual

  return (
    <>
      <TerrainProvider>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={theme}>
        <SQLiteProvider databaseName="DataBase.db" onInit={migrateDbIfNeeded}>
          <TabsNavigator />
        </SQLiteProvider>
      </ApplicationProvider>
      </TerrainProvider>
    </>
  );
}