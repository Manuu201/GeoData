import { SQLiteProvider } from 'expo-sqlite';
import TabsNavigator from './src/navigation/TabsNavigator';
import { migrateDbIfNeeded } from './src/database/database';

export default function App() {
  return (
    <SQLiteProvider databaseName="data.db" onInit={migrateDbIfNeeded}>
      <TabsNavigator />
    </SQLiteProvider>
  );
}
