import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import Onboarding from "./Onboarding";
import PrivateRoute from "./PrivateRoute";
import UserDashboard from "./UserDashboard";
import GoogleSignInTest from "./GoogleSignInTest";
import { EventsPage, EventDetail, MapView, Bookings, Favorites, ParametersPage } from "../pages";

const AppRoutes = ({ searchQuery, filters }) => {
    return (
        <Routes>
            <Route path="/" element={<EventsPage searchQuery={searchQuery} filters={filters} />} />
            <Route path="/home" element={<EventsPage searchQuery={searchQuery} filters={filters} />} />
            <Route path="/events" element={<EventsPage searchQuery={searchQuery} filters={filters} />} />
            <Route path="/map" element={<MapView searchQuery={searchQuery} filters={filters} />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/test-google-signin" element={<GoogleSignInTest />} />
            <Route
                path="/dashboard"
                element={
                    <PrivateRoute>
                        <UserDashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/onboarding"
                element={
                    <PrivateRoute>
                        <Onboarding />
                    </PrivateRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                }
            />
            <Route
                path="/bookings"
                element={
                    <PrivateRoute>
                        <Bookings />
                    </PrivateRoute>
                }
            />
            <Route
                path="/favorites"
                element={
                    <PrivateRoute>
                        <Favorites />
                    </PrivateRoute>
                }
            />
            <Route path="/parameters" element={<ParametersPage />} />
        </Routes>
    );
};

export default AppRoutes;
