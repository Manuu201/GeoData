import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, StyleSheet,Linking,Platform } from 'react-native';
import { Button } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';

import { 
  addNoteAsync, fetchNotesAsync, updateNoteAsync, deleteNoteAsync, 
  fetchTablesAsync, fetchPhotosAsync, NoteEntity, TableEntity, PhotoEntity 
} from '../database/database';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ProfileScreen'>;

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation<NavigationProp>();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<NoteEntity[]>([]);
  const [editingNote, setEditingNote] = useState<NoteEntity | null>(null);
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [photos, setPhotos] = useState<PhotoEntity[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchTables();
    fetchPhotos();
  }, []);

  async function fetchNotes() {
    setNotes(await fetchNotesAsync(db));
  }

  async function fetchTables() {
    setTables(await fetchTablesAsync(db));
  }

  async function fetchPhotos() {
    setPhotos(await fetchPhotosAsync(db));
  }

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

  function handleEditNote(note: NoteEntity) {
    setTitle(note.title);
    setContent(note.content);
    setEditingNote(note);
  }

  async function handleDeleteNote(id: number) {
    Alert.alert('Eliminar', '¿Estás seguro de eliminar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', onPress: async () => { await deleteNoteAsync(db, id); fetchNotes(); } }
    ]);
  }

  function handleInsertTable(table: TableEntity) {
    setContent(prev => prev + `\n📊 Tabla: ${table.name}\n${table.data.map(row => row.join(' | ')).join('\n')}\n`);
    setShowOptions(false);
  }

  function handleInsertPhoto(photo: PhotoEntity) {
    setContent(prev => prev + `\n📸 Foto: ${photo.uri}\n📍 Coordenadas: ${photo.latitude}, ${photo.longitude}\n`);
    setShowOptions(false);
  }

  async function exportToPDF(note: NoteEntity) {
    const htmlContent = `
      <html>
      <body>
        <h1>${note.title}</h1>
        <p>${note.content.replace(/\n/g, '<br>')}</p>
        
        <h2>📊 Tablas</h2>
        ${tables.map(table => `
          <h3>${table.name}</h3>
          <table border="1">
            ${table.data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </table>
        `).join('<br>')}
        
        <h2>📸 Fotos</h2>
        ${photos.map(photo => `
          <div>
            <img src="${photo.uri}" width="200"/>
            <p>📍 Coordenadas: ${photo.latitude}, ${photo.longitude}</p>
          </div>
        `).join('<br>')}
      </body>
      </html>
    `;
  
    try {
      // Generar el PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
  
      // Mover el archivo a una ubicación accesible
      const newPath = `${FileSystem.documentDirectory}nota_${note.id}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newPath });
  
      // Verificar si se puede abrir
      const canOpen = await Sharing.isAvailableAsync();
      if (canOpen) {
        await Sharing.shareAsync(newPath, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert('Error', 'No se puede abrir el PDF. Intenta abrirlo manualmente desde la app de archivos.');
      }
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al generar o abrir el PDF.');
    }
  }
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Bloc de Notas</Text>

      <TextInput placeholder="Título" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Contenido" value={content} onChangeText={setContent} style={styles.input} multiline />

      <View style={styles.buttonRow}>
        <Button mode="contained" onPress={handleSaveNote}>
          {editingNote ? 'Actualizar Nota' : 'Agregar Nota'}
        </Button>
        <Button mode="outlined" onPress={() => setShowOptions(!showOptions)}>
          Más
        </Button>
      </View>

      {showOptions && (
        <View style={styles.menu}>
          <Text style={styles.menuTitle}>Insertar en la nota:</Text>
          <FlatList
            data={tables}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleInsertTable(item)}>
                <Text style={styles.menuItem}>📊 {item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleInsertPhoto(item)}>
                <Text style={styles.menuItem}>📸 Foto {item.id}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.noteItem}>
            <TouchableOpacity onPress={() => handleEditNote(item)}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              <Text>{item.content}</Text>
            </TouchableOpacity>
            <View style={styles.buttonRow}>
              <Button mode="text" color="red" onPress={() => handleDeleteNote(item.id)}>
                Eliminar
              </Button>
              <Button mode="text" onPress={() => exportToPDF(item)}>
                📄 Ver PDF
              </Button>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5, backgroundColor: 'white' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  menu: { backgroundColor: '#e9ecef', padding: 10, marginBottom: 10, borderRadius: 5 },
  menuTitle: { fontWeight: 'bold', marginBottom: 5 },
  menuItem: { padding: 5 },
  noteItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', backgroundColor: 'white', borderRadius: 5, marginBottom: 5 },
  noteTitle: { fontWeight: 'bold' },
});

