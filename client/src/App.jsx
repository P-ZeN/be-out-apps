import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppRoutes from "./components/AppRoutes";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PlatformDebug from "./components/PlatformDebug";
import { AuthProvider } from "./context/AuthContext";
import { WebViewProvider } from "./context/WebViewContext";
import { theme } from "./theme";
import "./App.css";

// Build timestamp for deployment verification
console.log("App build timestamp:", "2025-07-11-18:00");

function App() {
    return (
        <Router>
            <AuthProvider>
                <WebViewProvider>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <PlatformDebug />
                        <Header />
                        <div className="main-content">
                            <AppRoutes />
                        </div>
                        <Footer />
                    </ThemeProvider>
                </WebViewProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
