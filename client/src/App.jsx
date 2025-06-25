import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './components/AppRoutes';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <hr />
        <AppRoutes />
        <Footer />
      </AuthProvider>
    </Router>
  )
}

export default App
