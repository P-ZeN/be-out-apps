import React, { useState, useEffect } from "react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { Button, TextField, Container, Typography, Box, Alert } from '@mui/material';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState({ first_name: "", last_name: "", bio: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await userService.getProfile();
                // Ensure no null values are passed to inputs
                const sanitizedProfile = {
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    bio: data.bio || "",
                };
                setProfile(sanitizedProfile);
            } catch (error) {
                setError("Failed to fetch profile");
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        try {
            await userService.updateProfile(profile);
            setMessage("Profile updated successfully");
        } catch (error) {
            setError("Failed to update profile");
        }
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Profile
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        fullWidth
                        id="first_name"
                        label="First Name"
                        name="first_name"
                        value={profile.first_name}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="last_name"
                        label="Last Name"
                        name="last_name"
                        value={profile.last_name}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="bio"
                        label="Bio"
                        name="bio"
                        multiline
                        rows={4}
                        value={profile.bio}
                        onChange={handleChange}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Update Profile
                    </Button>
                </Box>
            </Box>
            {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Container>
    );
};

export default Profile;
