import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PdfViewerScreen({ route }) {
  const { pdfUri } = route.params; // Recibe la URI del PDF

  return (
    <View style={styles.container}>
      <WebView source={{ uri: pdfUri }} style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
