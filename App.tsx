import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import TabsNavigator from './src/navigation/TabsNavigator';
import { migrateDbIfNeeded } from './src/database/database';

export default function App() {
  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={eva.light}>
        <SQLiteProvider databaseName="dataas.db" onInit={migrateDbIfNeeded}>
          <TabsNavigator />
        </SQLiteProvider>
      </ApplicationProvider>
    </>
  );
}