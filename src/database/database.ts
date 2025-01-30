import { SQLiteDatabase } from 'expo-sqlite';

export interface ItemEntity {
  id: number;
  done: boolean;
  value: string;
}

export interface NoteEntity {
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
export async function addNoteAsync(db: SQLiteDatabase, title: string, content: string): Promise<void> {
  if (title !== '' && content !== '') {
    await db.runAsync('INSERT INTO notes (title, content) VALUES (?, ?);', title, content);
  }
}

export async function fetchNotesAsync(db: SQLiteDatabase): Promise<NoteEntity[]> {
  return await db.getAllAsync<NoteEntity>('SELECT * FROM notes;');
}

export async function updateNoteAsync(db: SQLiteDatabase, id: number, title: string, content: string): Promise<void> {
  await db.runAsync('UPDATE notes SET title = ?, content = ? WHERE id = ?;', title, content, id);
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
    await db.runAsync('INSERT INTO tables (name, rows, columns, data) VALUES (?, ?, ?, ?);', name, rows, columns, dataString);
  }
}

export async function fetchTablesAsync(db: SQLiteDatabase): Promise<TableEntity[]> {
  const tables = await db.getAllAsync<{ id: number; name: string; rows: number; columns: number; data: string }>(
    'SELECT * FROM tables;'
  );

  console.log('📌 Tablas cargadas desde la base de datos:', tables);

  return tables.map(table => {
    let parsedData: string[][] = [[]];
    try {
      parsedData = JSON.parse(table.data) as string[][];
    } catch (error) {
      console.error("🚨 Error al parsear los datos de la tabla:", error);
    }

    return {
      ...table,
      data: parsedData, // Asegurarse de devolver una matriz
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

/**
 * Agrega una relación entre una nota y un adjunto (foto o tabla).
 */
export async function addNoteAttachmentAsync(db: SQLiteDatabase, noteId: number, type: 'photo' | 'table', attachmentId: number): Promise<void> {
  await db.runAsync('INSERT INTO note_attachments (note_id, type, attachment_id) VALUES (?, ?, ?);', noteId, type, attachmentId);
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
 * Migración de la base de datos.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 4;
  let { user_version: currentDbVersion } = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync('PRAGMA journal_mode = "wal";');

  if (currentDbVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, done INT, value TEXT);
      CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY NOT NULL, title TEXT, content TEXT);
      CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY NOT NULL, uri TEXT, latitude REAL, longitude REAL);
      CREATE TABLE IF NOT EXISTS tables (id INTEGER PRIMARY KEY NOT NULL,name TEXT,rows INT,columns INT,data TEXT);
      CREATE TABLE IF NOT EXISTS note_attachments (id INTEGER PRIMARY KEY NOT NULL,note_id INTEGER,type TEXT CHECK(type IN ('photo', 'table')),attachment_id INTEGER,FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE);
    `);
    currentDbVersion = 1;
  }

  if (currentDbVersion === 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT,
        rows INT,
        columns INT,
        data TEXT
      );
    `);
    currentDbVersion = 4;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}
