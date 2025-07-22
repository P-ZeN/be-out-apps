import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import Onboarding from "./Onboarding";
import PrivateRoute from "./PrivateRoute";
import HomeWrapper from "./HomeWrapper";
import { EventsPage, EventDetail, MapView, Bookings, Favorites } from "../pages";

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomeWrapper />} />
            <Route path="/home" element={<HomeWrapper />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
        </Routes>
    );
};

export default AppRoutes;
