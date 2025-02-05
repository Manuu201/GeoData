import type { NoteEntity, ReportEntity } from "../database/database"

export type RootStackParamList = {
  ProfileScreen: undefined
  PdfViewerScreen: { pdfUri: string }
  NotesScreen: undefined
  NoteEditorScreen: {
    note?: NoteEntity
    refreshNotes: () => Promise<void>
    onSave?: () => void
  }
  ReportsScreen: undefined
  ReportEditorScreen: {
    report?: ReportEntity
    refreshReports: () => Promise<void>
    onSave?: () => void
  }
}