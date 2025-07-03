import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { theme } from "./theme";
import { AuthProvider } from "./context/AuthContext";
import OrganizerMainLayout from "./components/OrganizerMainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventForm from "./pages/EventForm";
import Bookings from "./pages/Bookings";
import Revenue from "./pages/Revenue";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    // Add at the top of main.jsx
    console.log("🔍 Environment Debugbug bug bug bugbug bug bug bugbug bug bug bugbug bug bug bug:");
    console.log("All env vars:", import.meta.env);
    console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
    console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
    console.log("Is production?:", import.meta.env.PROD);

    // Add alert for quick verification
    if (import.meta.env.VITE_API_URL?.includes("localhost")) {
        alert("🚨 Still using localhost API URL!");
    }
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/*"
                            element={
                                <ProtectedRoute>
                                    <OrganizerMainLayout>
                                        <Routes>
                                            <Route path="/" element={<Navigate to="/dashboard" />} />
                                            <Route path="/dashboard" element={<Dashboard />} />
                                            <Route path="/events" element={<Events />} />
                                            <Route path="/events/new" element={<EventForm />} />
                                            <Route path="/events/:id/edit" element={<EventForm />} />
                                            <Route path="/bookings" element={<Bookings />} />
                                            <Route path="/revenue" element={<Revenue />} />
                                            <Route path="/profile" element={<Profile />} />
                                        </Routes>
                                    </OrganizerMainLayout>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
