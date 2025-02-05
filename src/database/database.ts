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
}

export interface TableEntity {
  id: number;
  name: string;
  rows: number;
  columns: number;
  data: string[][]; // Matriz para almacenar los datos de la tabla
}

export interface NoteAttachmentEntity {
  id: number;
  note_id: number;
  type: 'photo' | 'table';
  attachment_id: number;
}


export interface ReportEntity {
  id: number;
  name: string;
  rock_name: string;
  type: string;
  notes: string;
  photo_id?: number; // Relación con fotos
  table_id?: number; // Relación con tablas
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
  await db.runAsync('INSERT INTO photos (uri, latitude, longitude) VALUES (?, ?, ?);', uri, latitude, longitude);
}

export async function fetchPhotosAsync(db: SQLiteDatabase): Promise<PhotoEntity[]> {
  return await db.getAllAsync<PhotoEntity>('SELECT * FROM photos;');
}

export async function deletePhotoAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM photos WHERE id = ?;', id);
}

/**
 * CRUD de Tablas
 */
export async function addTableAsync(db: SQLiteDatabase, name: string, rows: number, columns: number, data: string[][]): Promise<void> {
  if (name !== '' && rows > 0 && columns > 0) {
    const dataString = JSON.stringify(data);
    console.log('📌 Insertando tabla con datos:', { name, rows, columns, dataString }); // Log para verificar que los datos se están pasando correctamente.
    await db.runAsync('INSERT INTO tables (name, rows, columns, data) VALUES (?, ?, ?, ?);', name, rows, columns, dataString);
  }
}


export async function fetchTablesAsync(db: SQLiteDatabase): Promise<TableEntity[]> {
  const tables = await db.getAllAsync<{ id: number; name: string; rows: number; columns: number; data: string }>(
    'SELECT * FROM tables;'
  );

  console.log('📌 Tablas cargadas desde la base de datos:', tables); // Log para verificar que las tablas se cargan correctamente.

  return tables.map(table => {
    let parsedData: string[][] = [[]];
    try {
      parsedData = JSON.parse(table.data) as string[][];
    } catch (error) {
      console.error("🚨 Error al parsear los datos de la tabla:", error);
    }

    return {
      ...table,
      data: parsedData,
    };
  });
}





export async function deleteTableAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM tables WHERE id = ?;', id);
}

export async function updateTableAsync(
  db: SQLiteDatabase,
  id: number,
  name: string,
  rows: number,
  columns: number,
  data: string[][]
): Promise<void> {
  const dataString = JSON.stringify(data); // Serializar la matriz
  console.log(`Actualizando tabla ID ${id} con datos:`, { name, rows, columns, dataString });

  await db.runAsync(
    'UPDATE tables SET name = ?, rows = ?, columns = ?, data = ? WHERE id = ?;',
    name,
    rows,
    columns,
    dataString,
    id
  );

  console.log('✅ Tabla actualizada correctamente en la base de datos.');
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


/**
 * Agrega un nuevo informe a la base de datos.
 */
export async function addReportAsync(
  db: SQLiteDatabase,
  name: string,
  rock_name: string,
  type: string,
  notes: string,
  photo_id?: number,
  table_id?: number
): Promise<void> {
  await db.runAsync(
    'INSERT INTO reports (name, rock_name, type, notes, photo_id, table_id) VALUES (?, ?, ?, ?, ?, ?);',
    name,
    rock_name,
    type,
    notes,
    photo_id || null,
    table_id || null
  );
}

/**
 * Obtiene todos los informes de la base de datos.
 */
export async function fetchReportsAsync(db: SQLiteDatabase): Promise<ReportEntity[]> {
  return await db.getAllAsync<ReportEntity>(`
    SELECT r.*, p.uri AS photo_uri, t.name AS table_name 
    FROM reports r
    LEFT JOIN photos p ON r.photo_id = p.id
    LEFT JOIN tables t ON r.table_id = t.id
    ORDER BY r.id DESC;
  `);
}

/**
 * Actualiza un informe en la base de datos.
 */
export async function updateReportAsync(
  db: SQLiteDatabase,
  id: number,
  name: string,
  rock_name: string,
  type: string,
  notes: string,
  photo_id?: number,
  table_id?: number
): Promise<void> {
  await db.runAsync(
    'UPDATE reports SET name = ?, rock_name = ?, type = ?, notes = ?, photo_id = ?, table_id = ? WHERE id = ?;',
    name,
    rock_name,
    type,
    notes,
    photo_id || null,
    table_id || null,
    id
  );
}

/**
 * Elimina un informe de la base de datos.
 */
export async function deleteReportAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM reports WHERE id = ?;', id);
}


/**
 * Migración de la base de datos.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 5; // Incrementamos la versión
  let { user_version: currentDbVersion } = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync('PRAGMA journal_mode = "wal";');

  if (currentDbVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, done INT, value TEXT);
      CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY NOT NULL, title TEXT, content TEXT, photos TEXT, tables TEXT);
      CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY NOT NULL, uri TEXT, latitude REAL, longitude REAL);
      CREATE TABLE IF NOT EXISTS tables (id INTEGER PRIMARY KEY NOT NULL, name TEXT, rows INT, columns INT, data TEXT);
      CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY NOT NULL, name TEXT, rock_name TEXT, type TEXT, notes TEXT, photo_id INTEGER, table_id INTEGER);
    `);
    currentDbVersion = 1;
  }

  if (currentDbVersion === 4) {
    await db.execAsync(`
      ALTER TABLE notes ADD COLUMN photos TEXT;
      ALTER TABLE notes ADD COLUMN tables TEXT;
    `);
    currentDbVersion = 5;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}