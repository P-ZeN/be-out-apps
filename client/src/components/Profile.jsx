import React, { useState, useEffect } from "react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState({ first_name: "", last_name: "", bio: "" });
    const [message, setMessage] = useState("");

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
                setMessage("Failed to fetch profile");
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
        try {
            await userService.updateProfile(profile);
            setMessage("Profile updated successfully");
        } catch (error) {
            setMessage("Failed to update profile");
        }
    };

    return (
        <div>
            <h2>Profile</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleChange}
                    placeholder="First Name"
                />
                <input
                    type="text"
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleChange}
                    placeholder="Last Name"
                />
                <textarea name="bio" value={profile.bio} onChange={handleChange} placeholder="Bio"></textarea>
                <button type="submit">Update Profile</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default Profile;
