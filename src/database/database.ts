import { SQLiteDatabase } from 'expo-sqlite';

// Nueva entidad para Terrenos
export interface TerrainEntity {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Modificar las entidades existentes para incluir terrainId
export interface NoteEntity {
  id: number;
  terrainId: number; // Nueva columna para asociar la nota a un terreno
  title: string;
  content: string;
  photos: string; // JSON string
  tables: string; // JSON string
  createdAt: string;
}

export interface PhotoEntity {
  id: number;
  terrainId: number; // Nueva columna para asociar la foto a un terreno
  uri: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface TableEntity {
  id: number;
  terrainId: number; // Nueva columna para asociar la tabla a un terreno
  name: string;
  rows: number;
  columns: number;
  data: string[][];
  created_at: string;
}

export interface NoteAttachmentEntity {
  id: number;
  note_id: number;
  type: 'photo' | 'table';
  attachment_id: number;
}

export interface ReportEntity {
  id: number;
  terrainId: number; // Nueva columna para asociar el reporte a un terreno
  type: 'sedimentary' | 'igneous' | 'metamorphic' | 'free' | 'sedimentaryChemistry' | 'pyroclastic';
  title: string;
  photoUri?: string;
  latitude?: number;
  longitude?: number;
  text1?: string;
  text2?: string;
  tableData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LithologyColumnEntity {
  id: number;
  terrainId: number; // Nueva columna para asociar la columna litológica a un terreno
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LithologyLayerEntity {
  id: number;
  columnId: number;
  type: 'sedimentary' | 'igneous' | 'metamorphic';
  subtype: string;
  thickness: number;
  structure: string;
  fossils: string;
  createdAt: string;
  updatedAt: string;
  order: number;
}

// CRUD de Terrenos
export async function addTerrainAsync(db: SQLiteDatabase, name: string): Promise<number> {
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  const result = await db.runAsync(
    'INSERT INTO terrains (name, createdAt, updatedAt) VALUES (?, ?, ?);',
    name, createdAt, updatedAt
  );
  return result.lastInsertRowId;
}

export async function fetchTerrainsAsync(db: SQLiteDatabase): Promise<TerrainEntity[]> {
  return await db.getAllAsync<TerrainEntity>('SELECT * FROM terrains;');
}

export async function updateTerrainAsync(db: SQLiteDatabase, id: number, name: string): Promise<void> {
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    'UPDATE terrains SET name = ?, updatedAt = ? WHERE id = ?;',
    name, updatedAt, id
  );
}

export async function deleteTerrainAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM terrains WHERE id = ?;', id);
}

// Modificar las funciones CRUD existentes para incluir terrainId
export async function addNoteAsync(
  db: SQLiteDatabase,
  terrainId: number,
  title: string,
  content: string,
  photos: PhotoEntity[] = [],
  tables: TableEntity[] = []
): Promise<void> {
  if (title !== "" && content !== "") {
    const photosJson = JSON.stringify(photos);
    const tablesJson = JSON.stringify(tables);
    const createdAt = new Date().toISOString();
    await db.runAsync(
      "INSERT INTO notes (terrainId, title, content, photos, tables, createdAt) VALUES (?, ?, ?, ?, ?, ?);",
      terrainId, title, content, photosJson, tablesJson, createdAt
    );
  }
}

export async function fetchNotesAsync(db: SQLiteDatabase, terrainId: number): Promise<NoteEntity[]> {
  const notes = await db.getAllAsync<NoteEntity>("SELECT * FROM notes WHERE terrainId = ?;", terrainId);
  return notes.map((note) => ({
    ...note,
    photos: note.photos ? JSON.parse(note.photos) : [],
    tables: note.tables ? JSON.parse(note.tables) : [],
    createdAt: note.createdAt || new Date().toISOString(),
  }));
}

export async function updateNoteAsync(
  db: SQLiteDatabase,
  id: number,
  title: string,
  content: string,
  photos: PhotoEntity[] = [],
  tables: TableEntity[] = []
): Promise<void> {
  const photosJson = JSON.stringify(photos);
  const tablesJson = JSON.stringify(tables);
  await db.runAsync(
    "UPDATE notes SET title = ?, content = ?, photos = ?, tables = ? WHERE id = ?;",
    title, content, photosJson, tablesJson, id
  );
}

export async function deleteNoteAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync("DELETE FROM notes WHERE id = ?;", id);
}

export async function addPhotoAsync(
  db: SQLiteDatabase,
  terrainId: number,
  uri: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const createdAt = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO photos (terrainId, uri, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?);',
    terrainId, uri, latitude, longitude, createdAt
  );
}

export async function fetchPhotosAsync(db: SQLiteDatabase, terrainId: number): Promise<PhotoEntity[]> {
  return await db.getAllAsync<PhotoEntity>('SELECT * FROM photos WHERE terrainId = ?;', terrainId);
}

export async function deletePhotoAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM photos WHERE id = ?;', id);
}

export async function addTableAsync(
  db: SQLiteDatabase,
  terrainId: number,
  name: string,
  rows: number,
  columns: number,
  data?: string[][]
): Promise<void> {
  const validatedData = data || Array.from({ length: rows }, () => Array(columns).fill(""));
  const dataString = JSON.stringify(validatedData);
  const createdAt = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO tables (terrainId, name, rows, columns, data, created_at) VALUES (?, ?, ?, ?, ?, ?);',
    terrainId, name, rows, columns, dataString, createdAt
  );
}

export async function fetchTablesAsync(db: SQLiteDatabase, terrainId: number): Promise<TableEntity[]> {
  const tables = await db.getAllAsync<{
    id: number;
    terrainId: number; // Incluir terrainId en la consulta
    name: string;
    rows: number;
    columns: number;
    data: string;
    created_at: string;
  }>('SELECT id, terrainId, name, rows, columns, data, created_at FROM tables WHERE terrainId = ?;', terrainId);

  return tables.map(table => {
    let parsedData: string[][] = Array.from({ length: table.rows }, () => Array(table.columns).fill(""));

    try {
      parsedData = table.data ? JSON.parse(table.data) as string[][] : parsedData;
    } catch (error) {
      console.error("Error al parsear los datos de la tabla:", error);
    }

    return {
      ...table,
      data: parsedData,
    };
  });
}

export async function updateTableAsync(
  db: SQLiteDatabase,
  id: number,
  name: string,
  rows: number,
  columns: number,
  data: string[][]
): Promise<void> {
  let normalizedData = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, colIndex) => data[rowIndex]?.[colIndex] ?? "")
  );

  const dataString = JSON.stringify(normalizedData);

  await db.runAsync(
    'UPDATE tables SET name = ?, rows = ?, columns = ?, data = ? WHERE id = ?;',
    name, rows, columns, dataString, id
  );
}

export async function deleteTableAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM tables WHERE id = ?;', id);
}

export async function addReportAsync(db: SQLiteDatabase, report: Omit<ReportEntity, "id" | "createdAt" | "updatedAt">): Promise<void> {
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  await db.runAsync(
    `INSERT INTO reports (
      terrainId, type, title, photoUri, latitude, longitude, text1, text2, tableData, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      report.terrainId,
      report.type,
      report.title,
      report.photoUri || null,
      report.latitude || null,
      report.longitude || null,
      report.text1 || null,
      report.text2 || null,
      report.tableData || null,
      createdAt,
      updatedAt,
    ]
  );
}

export async function updateReportAsync(db: SQLiteDatabase, report: ReportEntity): Promise<void> {
  const updatedAt = new Date().toISOString();

  await db.runAsync(
    `UPDATE reports SET
      terrainId = ?, type = ?, title = ?, photoUri = ?, latitude = ?, longitude = ?, text1 = ?, text2 = ?, tableData = ?, updatedAt = ?
    WHERE id = ?;`,
    [
      report.terrainId,
      report.type,
      report.title,
      report.photoUri || null,
      report.latitude || null,
      report.longitude || null,
      report.text1 || null,
      report.text2 || null,
      report.tableData || null,
      updatedAt,
      report.id,
    ]
  );
}

export async function fetchReportsAsync(db: SQLiteDatabase, terrainId: number): Promise<ReportEntity[]> {
  return await db.getAllAsync<ReportEntity>('SELECT * FROM reports WHERE terrainId = ?;', terrainId);
}

export async function deleteReportAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM reports WHERE id = ?;', id);
}

export async function createColumnAsync(
  db: SQLiteDatabase,
  terrainId: number,
  name: string
): Promise<number> {
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  const result = await db.runAsync(
    'INSERT INTO columns (terrainId, name, createdAt, updatedAt) VALUES (?, ?, ?, ?);',
    terrainId, name, createdAt, updatedAt
  );
  return result.lastInsertRowId;
}

export async function fetchColumnsAsync(db: SQLiteDatabase, terrainId: number): Promise<LithologyColumnEntity[]> {
  return await db.getAllAsync<LithologyColumnEntity>('SELECT * FROM columns WHERE terrainId = ?;', terrainId);
}

export async function addLayerAsync(
  db: SQLiteDatabase,
  columnId: number,
  type: 'sedimentary' | 'igneous' | 'metamorphic',
  subtype: string,
  thickness: number,
  structure: string,
  fossils: string
): Promise<void> {
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  const maxOrderResult = await db.getFirstAsync<{ maxOrder: number }>(
    'SELECT MAX(`order`) as maxOrder FROM layers WHERE columnId = ?;',
    columnId
  );
  const order = (maxOrderResult?.maxOrder || 0) + 1;

  await db.runAsync(
    'INSERT INTO layers (columnId, type, subtype, thickness, structure, fossils, createdAt, updatedAt, `order`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    columnId, type, subtype, thickness, structure, fossils, createdAt, updatedAt, order
  );
}

export async function fetchLayersAsync(db: SQLiteDatabase, columnId: number): Promise<LithologyLayerEntity[]> {
  return await db.getAllAsync<LithologyLayerEntity>(
    'SELECT * FROM layers WHERE columnId = ? ORDER BY `order` ASC;',
    columnId
  );
}

export async function updateLayerOrderAsync(
  db: SQLiteDatabase,
  id: number,
  order: number
): Promise<void> {
  const updatedAt = new Date().toISOString();

  await db.runAsync(
    'UPDATE layers SET `order` = ?, updatedAt = ? WHERE id = ?;',
    order, updatedAt, id
  );
}

export async function updateLayerAsync(
  db: SQLiteDatabase,
  id: number,
  type: 'sedimentary' | 'igneous' | 'metamorphic',
  subtype: string,
  thickness: number,
  structure: string,
  fossils: string
): Promise<void> {
  const updatedAt = new Date().toISOString();

  await db.runAsync(
    'UPDATE layers SET type = ?, subtype = ?, thickness = ?, structure = ?, fossils = ?, updatedAt = ? WHERE id = ?;',
    type, subtype, thickness, structure, fossils, updatedAt, id
  );
}

export async function deleteLayerAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM layers WHERE id = ?;', id);
}

export async function deleteColumnAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM columns WHERE id = ?;', id);
  await db.runAsync('DELETE FROM layers WHERE columnId = ?;', id);
}

/**
 * Migración de la base de datos.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 7; // Nueva versión incrementada
  let { user_version: currentDbVersion } = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync('PRAGMA journal_mode = "wal";');

  if (currentDbVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS terrains (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY NOT NULL,
        terrainId INTEGER NOT NULL,
        title TEXT,
        content TEXT,
        photos TEXT DEFAULT '[]',
        tables TEXT DEFAULT '[]',
        createdAt TEXT NOT NULL,
        FOREIGN KEY (terrainId) REFERENCES terrains (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY NOT NULL,
        terrainId INTEGER NOT NULL,
        uri TEXT,
        latitude REAL,
        longitude REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (terrainId) REFERENCES terrains (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY NOT NULL,
        terrainId INTEGER NOT NULL,
        name TEXT,
        rows INT,
        columns INT,
        data TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (terrainId) REFERENCES terrains (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        terrainId INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        photoUri TEXT,
        latitude REAL,
        longitude REAL,
        text1 TEXT,
        text2 TEXT,
        tableData TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (terrainId) REFERENCES terrains (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS columns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        terrainId INTEGER NOT NULL,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (terrainId) REFERENCES terrains (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS layers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        columnId INTEGER NOT NULL,
        type TEXT NOT NULL,
        subtype TEXT NOT NULL,
        thickness REAL NOT NULL,
        structure TEXT,
        fossils TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        \`order\` INTEGER,
        FOREIGN KEY (columnId) REFERENCES columns (id) ON DELETE CASCADE
      );
    `);
    currentDbVersion = 7;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}