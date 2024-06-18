import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import './App.css';

const App = () => {
  const [journalEntry, setJournalEntry] = useState('');
  const [entries, setEntries] = useState([]);

  // Load saved entries from local storage when the app starts
  useEffect(() => {
    const openRequest = indexedDB.open('journalDB', 1);

    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
    };

    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        setEntries(getAllRequest.result);
      };
    };
  }, []);

  const handleSaveEntry = () => {
    const openRequest = indexedDB.open('journalDB', 1);

    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('entries', 'readwrite');
      const store = transaction.objectStore('entries');

      const newEntry = {
        date: new Date().toLocaleString(),
        text: journalEntry,
      };

      const addRequest = store.add(newEntry);

      addRequest.onsuccess = () => {
        setEntries([newEntry, ...entries]);
        setJournalEntry('');
      };
    };
  };

  const handleExportDataAsJSON = () => {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    saveAs(blob, 'journalEntries.json');
  };

  const handleExportDataAsWord = () => {
    const doc = new Document({
      sections: [
        {
          children: entries.map(entry => (
            new Paragraph({
              children: [
                new TextRun({
                  text: entry.date,
                  bold: true,
                }),
                new TextRun({
                  text: '\n' + entry.text,
                }),
                new TextRun({
                  text: '\n\n',
                }),
              ],
            })
          )),
        },
      ],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'journalEntries.docx');
    });
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '40px' }}>
      <Typography variant="h3" gutterBottom style={{ fontFamily: 'Pacifico, cursive' }}>
        Journal App
      </Typography>
      <Typography variant="body1" color="error" gutterBottom>
        Note: Your journal entries are stored locally in your browser using IndexedDB. If you clear your browser's site data, your entries will be lost.
      </Typography>
      <TextField
        label="Journal Entry"
        multiline
        fullWidth
        rows={4}
        value={journalEntry}
        onChange={(e) => setJournalEntry(e.target.value)}
        variant="outlined"
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleSaveEntry} fullWidth>
        Save Entry
      </Button>
      <Button variant="contained" color="secondary" onClick={handleExportDataAsJSON} fullWidth style={{ marginTop: '10px' }}>
        Export as JSON
      </Button>
      <Button variant="contained" color="secondary" onClick={handleExportDataAsWord} fullWidth style={{ marginTop: '10px' }}>
        Export as Word Doc
      </Button>
      <List>
        {entries.map((entry, index) => (
          <ListItem key={index} component={Paper} style={{ margin: '10px 0' }}>
            <ListItemText primary={entry.date} secondary={entry.text} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default App;
