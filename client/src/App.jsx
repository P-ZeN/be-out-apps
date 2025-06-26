import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRoutes from './components/AppRoutes';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { theme } from './theme';
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Header />
          <hr />
          <AppRoutes />
          <Footer />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
