import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppRoutes from "./components/AppRoutes";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import { theme } from "./theme";
import "./App.css";

function App() {
    console.log("🔍 Environment Debugbug bug bug bug:");
    console.log("All env vars:", import.meta.env);
    console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
    console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
    console.log("Is production?:", import.meta.env.PROD);
    return (
        <Router>
            <AuthProvider>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Header />
                    <div className="main-content">
                        <AppRoutes />
                    </div>
                    <Footer />
                </ThemeProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
