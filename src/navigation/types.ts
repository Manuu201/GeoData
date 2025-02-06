import type { NoteEntity, ReportEntity, TableEntity } from "../database/database";

export type RootStackParamList = {
  MainTabs: undefined;
  PdfViewerScreen: { pdfUri: string };
  NotesScreen: undefined;
  NoteEditorScreen: {
    note?: NoteEntity;
    refreshNotes: () => Promise<void>;
    onSave?: () => void;
  };
  ReportsScreen: undefined;
  ReportEditorScreen: {
    report?: ReportEntity;
    refreshReports: () => Promise<void>;
    onSave?: () => void;
  };
  TableEditorScreen: {
    table: TableEntity;
    onSave?: () => void;
  };
  OfflineMapScreen: undefined;
};
