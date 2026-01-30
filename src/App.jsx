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
          <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/hospitals" element={<HospitalsPage />} />
              <Route path="/hospital/:id" element={<HospitalDetailPage />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;

