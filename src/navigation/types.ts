import type { NoteEntity } from "../database/database"

export type RootStackParamList = {
  ProfileScreen: undefined
  PdfViewerScreen: { pdfUri: string }
  NotesScreen: undefined
  NoteEditorScreen: {
    note?: NoteEntity
    refreshNotes: () => Promise<void>
    onSave?: () => void
  }
}

