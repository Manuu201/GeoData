import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { addNoteAsync, fetchNotesAsync, updateNoteAsync, deleteNoteAsync, NoteEntity } from '../database/database';

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<NoteEntity[]>([]);
  const [editingNote, setEditingNote] = useState<NoteEntity | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  /** Obtiene las notas de la base de datos */
  async function fetchNotes() {
    const allNotes = await fetchNotesAsync(db);
    setNotes(allNotes);
  }

  /** Maneja la creación o actualización de una nota */
  async function handleSaveNote() {
    if (title.trim() === '' || content.trim() === '') return;

    if (editingNote) {
      await updateNoteAsync(db, editingNote.id, title, content);
      setEditingNote(null);
    } else {
      await addNoteAsync(db, title, content);
    }

    setTitle('');
    setContent('');
    fetchNotes();
  }

  /** Carga una nota existente para editar */
  function handleEditNote(note: NoteEntity) {
    setTitle(note.title);
    setContent(note.content);
    setEditingNote(note);
  }

  /** Elimina una nota */
  async function handleDeleteNote(id: number) {
    await deleteNoteAsync(db, id);
    fetchNotes();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Bloc de Notas</Text>

      <TextInput
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        placeholder="Contenido"
        value={content}
        onChangeText={setContent}
        style={styles.input}
        multiline
      />
      <Button title={editingNote ? 'Actualizar Nota' : 'Agregar Nota'} onPress={handleSaveNote} />

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.noteItem}>
            <TouchableOpacity onPress={() => handleEditNote(item)}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              <Text>{item.content}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 },
  noteItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  noteTitle: { fontWeight: 'bold' },
  deleteText: { color: 'red', marginTop: 5 },
});
