import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { fr } from "date-fns/locale";
import { AuthProvider } from "./context/AuthContext";
import OrganizerMainLayout from "./components/OrganizerMainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventForm from "./pages/EventForm";
import EventStatusHistory from "./pages/EventStatusHistory";
import OrganizerNotifications from "./pages/OrganizerNotifications";
import VenueManagement from "./pages/VenueManagement";
import Bookings from "./pages/Bookings";
import Revenue from "./pages/Revenue";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { theme } from "./theme";

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
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
                                                <Route
                                                    path="/events/:id/status-history"
                                                    element={<EventStatusHistory />}
                                                />
                                                <Route path="/notifications" element={<OrganizerNotifications />} />
                                                <Route path="/venues" element={<VenueManagement />} />
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
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;
