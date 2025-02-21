import type { NoteEntity, ReportEntity, TableEntity } from "../database/database"

export type RootStackParamList = {
  MainTabs: undefined
  PdfViewerScreen: { pdfUri: string }
  NotesScreen: undefined
  NoteEditorScreen: {
    note?: NoteEntity
    refreshNotes: () => Promise<void>
    onSave?: () => void
  }
  ReportsScreen: { shouldRefresh: boolean }
  ReportsEditorScreen: { report?: ReportEntity }
  TableEditorScreen: {
    table: TableEntity
    onSave?: () => void
  }
  OfflineMapScreen: undefined
  StructuralDataScreen: { photoId: number }
  PhotoSelectorScreen: undefined
  LithologyListScreen: undefined
  CreateColumnScreen: undefined
  LithologyFormScreen: { columnId: number }
}

