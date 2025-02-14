import type { NoteEntity, ReportEntity, TableEntity, PhotoEntity } from "../database/database";


export type RootStackParamList = {
  MainTabs: undefined;
  PdfViewerScreen: { pdfUri: string };
  NotesScreen: undefined;
  NoteEditorScreen: {
    note?: NoteEntity;
    refreshNotes: () => Promise<void>;
    onSave?: () => void;
  };
  ReportsScreen: { shouldRefresh: boolean };
  ReportsEditorScreen: { report?: ReportEntity };
  TableEditorScreen: {
    table: TableEntity;
    onSave?: () => void;
  };
  OfflineMapScreen: undefined;
  StructuralDataScreen: { photoId: number }; // Ruta para el plano geológico
  PhotoSelectorScreen: undefined; // Nueva ruta para seleccionar fotos
};