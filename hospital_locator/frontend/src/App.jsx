import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';

// Components
import Header from './components/Header';
import MapPage from './pages/MapPage';
import HospitalsPage from './pages/HospitalsPage';
import HospitalDetailPage from './pages/HospitalDetailPage';
import AdminPage from './pages/AdminPage';

// GIS Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Header />
          <Routes>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/" element={
              <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
                <MapPage />
              </Container>
            } />
            <Route path="/hospitals" element={
              <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
                <HospitalsPage />
              </Container>
            } />
            <Route path="/hospital/:id" element={
              <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
                <HospitalDetailPage />
              </Container>
            } />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
