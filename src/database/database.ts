import { SQLiteDatabase } from 'expo-sqlite';

export interface ItemEntity {
  id: number;
  done: boolean;
  value: string;
}

export interface NoteEntity {
  photos: string;
  tables: string;
  id: number;
  title: string;
  content: string;
}

export interface PhotoEntity {
  id: number;
  uri: string;
  latitude: number;
  longitude: number;
  created_at: string; // Nuevo campo de fecha
}

export interface TableEntity {
  id: number;
  name: string;
  rows: number;
  columns: number;
  data: string[][]; 
  created_at: string; // Nuevo campo de fecha
}

export interface NoteAttachmentEntity {
  id: number;
  note_id: number;
  type: 'photo' | 'table';
  attachment_id: number;
}

export interface ReportEntity {
  id: number;
  type: 'sedimentary' | 'igneous' | 'free'; // Tipo de roca
  title: string; // Título del reporte
  photoUri?: string; // URI de la foto
  latitude?: number; // Latitud de la foto
  longitude?: number; // Longitud de la foto
  text1?: string; // Texto dinámico 1 (depende del tipo de roca)
  text2?: string; // Texto dinámico 2 (depende del tipo de roca)
  tableData?: string; // Datos de la tabla en formato JSON
  createdAt: string; // Fecha de creación
  updatedAt: string; // Fecha de actualización
}


export interface LithologyEntity {
  id: number;
  type: 'sedimentary' | 'igneous' | 'metamorphic';
  subtype: string;
  thickness: number;
  structure: string;
  fossils: string;
  imageUri?: string;
  notes?: string;
  geologicalEvent?: string;
  createdAt: string;
  updatedAt: string;
}


export interface LithologyColumnEntity {
  id: number;
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
}


/**
 * Agrega un nuevo item a la lista de tareas.
 */
export async function addItemAsync(db: SQLiteDatabase, text: string): Promise<void> {
  if (text !== '') {
    await db.runAsync('INSERT INTO items (done, value) VALUES (?, ?);', false, text);
  }
}

/**
 * Marca un item como completado.
 */
export async function updateItemAsDoneAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE items SET done = ? WHERE id = ?;', true, id);
}

/**
 * Elimina un item de la lista de tareas.
 */
export async function deleteItemAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM items WHERE id = ?;', id);
}

/**
 * Obtiene todos los items de la base de datos.
 */
export async function fetchItemsAsync(db: SQLiteDatabase): Promise<{ todoItems: ItemEntity[]; doneItems: ItemEntity[] }> {
  const todoItems = await db.getAllAsync<ItemEntity>('SELECT * FROM items WHERE done = ?;', false);
  const doneItems = await db.getAllAsync<ItemEntity>('SELECT * FROM items WHERE done = ?;', true);
  return { todoItems, doneItems };
}

/**
 * CRUD de Notas
 */
export async function addNoteAsync(db: SQLiteDatabase, title: string, content: string, photos: PhotoEntity[] = [], tables: TableEntity[] = []): Promise<void> {
  if (title !== '' && content !== '') {
    const photosJson = JSON.stringify(photos);
    const tablesJson = JSON.stringify(tables);
    await db.runAsync('INSERT INTO notes (title, content, photos, tables) VALUES (?, ?, ?, ?);', title, content, photosJson, tablesJson);
  }
}

export async function fetchNotesAsync(db: SQLiteDatabase): Promise<NoteEntity[]> {
  const notes = await db.getAllAsync<NoteEntity>('SELECT * FROM notes;');
  return notes.map(note => ({
    ...note,
    photos: note.photos ? JSON.parse(note.photos) : [],
    tables: note.tables ? JSON.parse(note.tables) : [],
  }));
}



export async function updateNoteAsync(db: SQLiteDatabase, id: number, title: string, content: string, photos: PhotoEntity[] = [], tables: TableEntity[] = []): Promise<void> {
  const photosJson = JSON.stringify(photos);
  const tablesJson = JSON.stringify(tables);
  await db.runAsync('UPDATE notes SET title = ?, content = ?, photos = ?, tables = ? WHERE id = ?;', title, content, photosJson, tablesJson, id);
}

export async function deleteNoteAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM notes WHERE id = ?;', id);
}
/**
 * CRUD de Fotos
 */

export async function addPhotoAsync(db: SQLiteDatabase, uri: string, latitude: number, longitude: number): Promise<void> {
  const createdAt = new Date().toISOString();
  await db.runAsync('INSERT INTO photos (uri, latitude, longitude, created_at) VALUES (?, ?, ?, ?);', uri, latitude, longitude, createdAt);
}

export async function fetchPhotosAsync(db: SQLiteDatabase): Promise<PhotoEntity[]> {
  return await db.getAllAsync<PhotoEntity>('SELECT * FROM photos;');
}

export async function deletePhotoAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM photos WHERE id = ?;', id);
}
export async function fetchPhotosByDateAsync(db: SQLiteDatabase, filter: 'day' | 'month' | 'year'): Promise<PhotoEntity[]> {
  let query = 'SELECT * FROM photos WHERE 1=1';

  if (filter === 'day') {
    query += ' AND DATE(created_at) = DATE("now")';
  } else if (filter === 'month') {
    query += ' AND strftime("%Y-%m", created_at) = strftime("%Y-%m", "now")';
  } else if (filter === 'year') {
    query += ' AND strftime("%Y", created_at) = strftime("%Y", "now")';
  }

  return await db.getAllAsync<PhotoEntity>(query);
}



/** 
 * CRUD de Tablas
 */
export async function addTableAsync(
  db: SQLiteDatabase, 
  name: string, 
  rows: number, 
  columns: number, 
  data?: string[][]
): Promise<void> {
  // Se crea una matriz vacía si no hay datos
  const validatedData = data || Array.from({ length: rows }, () => Array(columns).fill(""));
  const dataString = JSON.stringify(validatedData);
  const createdAt = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO tables (name, rows, columns, data, created_at) VALUES (?, ?, ?, ?, ?);',
    name, rows, columns, dataString, createdAt
  );
}

export async function fetchTablesAsync(db: SQLiteDatabase): Promise<TableEntity[]> {
  const tables = await db.getAllAsync<{
    id: number;
    name: string;
    rows: number;
    columns: number;
    data: string;
    created_at: string;
  }>('SELECT id, name, rows, columns, data, created_at FROM tables;');

  console.log('📌 Tablas cargadas desde la base de datos:', tables);

  return tables.map(table => {
    let parsedData: string[][] = Array.from({ length: table.rows }, () => Array(table.columns).fill(""));

    try {
      parsedData = table.data ? JSON.parse(table.data) as string[][] : parsedData;
    } catch (error) {
      console.error("🚨 Error al parsear los datos de la tabla:", error);
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
  console.log(`Actualizando tabla ID ${id} con datos:`, { name, rows, columns, data });

  // Asegurar que los datos coincidan con la nueva estructura de filas y columnas
  let normalizedData = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, colIndex) => data[rowIndex]?.[colIndex] ?? "")
  );

  const dataString = JSON.stringify(normalizedData);

  await db.runAsync(
    'UPDATE tables SET name = ?, rows = ?, columns = ?, data = ? WHERE id = ?;',
    name, rows, columns, dataString, id
  );

  console.log('✅ Tabla actualizada correctamente en la base de datos.');
}

export async function deleteTableAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM tables WHERE id = ?;', id);
}

export async function addNoteAttachmentAsync(
  db: SQLiteDatabase,
  noteId: number,
  type: 'photo' | 'table',
  attachmentId: number
): Promise<void> {
  await db.runAsync(
    'INSERT INTO note_attachments (note_id, type, attachment_id) VALUES (?, ?, ?);',
    noteId,
    type,
    attachmentId
  );
}
/**
 * Obtiene los adjuntos de una nota específica.
 */
export async function fetchNoteAttachmentsAsync(db: SQLiteDatabase, noteId: number): Promise<NoteAttachmentEntity[]> {
  return await db.getAllAsync<NoteAttachmentEntity>('SELECT * FROM note_attachments WHERE note_id = ?;', noteId);
}

/**
 * Elimina un adjunto específico de una nota.
 */
export async function deleteNoteAttachmentAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM note_attachments WHERE id = ?;', id);
}



export async function addReportAsync(db: SQLiteDatabase, report: Omit<ReportEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  try {
    await db.runAsync(
      `INSERT INTO reports (
        type, title, photoUri, latitude, longitude, text1, text2, tableData, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      report.type, report.title, report.photoUri, report.latitude, report.longitude, report.text1, report.text2, report.tableData, createdAt, updatedAt
    );
    console.log('Reporte agregado correctamente:', report); // Verifica los datos insertados
  } catch (error) {
    console.error('Error al agregar el reporte:', error);
  }
}

export async function fetchReportsAsync(db: SQLiteDatabase): Promise<ReportEntity[]> {
  try {
    const reports = await db.getAllAsync<ReportEntity>('SELECT * FROM reports;');
    console.log('Reportes recuperados:', reports); // Verifica los datos recuperados
    return reports;
  } catch (error) {
    console.error('Error al recuperar los reportes:', error);
    return [];
  }
}

export async function updateReportAsync(db: SQLiteDatabase, report: ReportEntity): Promise<void> {
  const updatedAt = new Date().toISOString();

  try {
    await db.runAsync(
      `UPDATE reports SET
        type = ?, title = ?, photoUri = ?, latitude = ?, longitude = ?, text1 = ?, text2 = ?, tableData = ?, updatedAt = ?
      WHERE id = ?;`,
      report.type, report.title, report.photoUri, report.latitude, report.longitude, report.text1, report.text2, report.tableData, updatedAt, report.id
    );
    console.log('Reporte actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar el reporte:', error);
  }
}

export async function deleteReportAsync(db: SQLiteDatabase, id: number): Promise<void> {
  try {
    await db.runAsync('DELETE FROM reports WHERE id = ?;', id);
    console.log('Reporte eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar el reporte:', error);
  }
}


export async function addLithologyAsync(
  db: SQLiteDatabase,
  type: 'sedimentary' | 'igneous' | 'metamorphic',
  subtype: string,
  thickness: number,
  structure: string,
  fossils: string,
  imageUri?: string,
  notes?: string,
  geologicalEvent?: string
): Promise<void> {
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  await db.runAsync(
    'INSERT INTO lithologies (type, subtype, thickness, structure, fossils, imageUri, notes, geologicalEvent, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
    type, subtype, thickness, structure, fossils, imageUri || null, notes || null, geologicalEvent || null, createdAt, updatedAt
  );
}

export async function fetchLithologiesAsync(db: SQLiteDatabase): Promise<LithologyEntity[]> {
  return await db.getAllAsync<LithologyEntity>('SELECT * FROM lithologies;');
}

export async function updateLithologyAsync(
  db: SQLiteDatabase,
  id: number,
  type: 'sedimentary' | 'igneous' | 'metamorphic',
  subtype: string,
  thickness: number,
  structure: string,
  fossils: string,
  imageUri?: string,
  notes?: string,
  geologicalEvent?: string
): Promise<void> {
  const updatedAt = new Date().toISOString();

  await db.runAsync(
    'UPDATE lithologies SET type = ?, subtype = ?, thickness = ?, structure = ?, fossils = ?, imageUri = ?, notes = ?, geologicalEvent = ?, updatedAt = ? WHERE id = ?;',
    type, subtype, thickness, structure, fossils, imageUri || null, notes || null, geologicalEvent || null, updatedAt, id
  );
}

export async function deleteLithologyAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM lithologies WHERE id = ?;', id);
}


export async function createColumnAsync(db: SQLiteDatabase, name: string): Promise<number> {
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  console.log(`Creando columna litográfica: ${name}`); // Log para depuración

  try {
    const result = await db.runAsync(
      'INSERT INTO columns (name, createdAt, updatedAt) VALUES (?, ?, ?);',
      name, createdAt, updatedAt
    );
    console.log(`Columna creada con ID: ${result.lastInsertRowId}`); // Log para depuración
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error al crear la columna:', error); // Log para depuración
    throw error;
  }
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

  console.log(`Agregando capa a la columna ${columnId}:`, { type, subtype, thickness, structure, fossils }); // Log para depuración

  try {
    await db.runAsync(
      'INSERT INTO layers (columnId, type, subtype, thickness, structure, fossils, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      columnId, type, subtype, thickness, structure, fossils, createdAt, updatedAt
    );
    console.log('Capa agregada correctamente'); // Log para depuración
  } catch (error) {
    console.error('Error al agregar la capa:', error); // Log para depuración
    throw error;
  }
}

export async function fetchColumnsAsync(db: SQLiteDatabase): Promise<LithologyColumnEntity[]> {
  console.log('Recuperando todas las columnas litográficas'); // Log para depuración

  try {
    const columns = await db.getAllAsync<LithologyColumnEntity>('SELECT * FROM columns;');
    console.log('Columnas recuperadas:', columns); // Log para depuración
    return columns;
  } catch (error) {
    console.error('Error al recuperar las columnas:', error); // Log para depuración
    return [];
  }
}

export async function fetchLayersAsync(db: SQLiteDatabase, columnId: number): Promise<LithologyLayerEntity[]> {
  console.log(`Recuperando capas para la columna ${columnId}`); // Log para depuración

  try {
    const layers = await db.getAllAsync<LithologyLayerEntity>('SELECT * FROM layers WHERE columnId = ?;', columnId);
    console.log('Capas recuperadas:', layers); // Log para depuración
    return layers;
  } catch (error) {
    console.error('Error al recuperar las capas:', error); // Log para depuración
    return [];
  }
}

export async function deleteColumnAsync(db: SQLiteDatabase, id: number): Promise<void> {
  console.log(`Eliminando columna con ID: ${id}`); // Log para depuración

  try {
    await db.runAsync('DELETE FROM columns WHERE id = ?;', id);
    await db.runAsync('DELETE FROM layers WHERE columnId = ?;', id);
    console.log('Columna y capas asociadas eliminadas correctamente'); // Log para depuración
  } catch (error) {
    console.error('Error al eliminar la columna:', error); // Log para depuración
    throw error;
  }
}

 /**
 * Migración de la base de datos.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 6; // Nueva versión incrementada
  let { user_version: currentDbVersion } = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync('PRAGMA journal_mode = "wal";');

  if (currentDbVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY NOT NULL,
        done INT,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY NOT NULL,
        title TEXT,
        content TEXT,
        photos TEXT DEFAULT '[]',
        tables TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY NOT NULL,
        uri TEXT,
        latitude REAL,
        longitude REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT,
        rows INT,
        columns INT,
        data TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        photoUri TEXT,
        latitude REAL,
        longitude REAL,
        text1 TEXT,
        text2 TEXT,
        tableData TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS lithologies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        subtype TEXT NOT NULL,
        thickness REAL NOT NULL,
        structure TEXT,
        fossils TEXT,
        imageUri TEXT,
        notes TEXT,
        geologicalEvent TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS columns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
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
        FOREIGN KEY (columnId) REFERENCES columns (id) ON DELETE CASCADE
      );
    `);
    currentDbVersion = 6;
  }

  if (currentDbVersion === 5) {
    await db.execAsync(`
      ALTER TABLE notes ADD COLUMN photos TEXT;
      ALTER TABLE notes ADD COLUMN tables TEXT;
      ALTER TABLE notes ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE photos ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE tables ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
    `);
    currentDbVersion = 6;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}