import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await authService.login({ email, password });
            login(response); // Pass the whole response to login
            setMessage("Login successful");
            navigate("/profile");
        } catch (error) {
            setMessage("Login failed");
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit">Login</button>
            </form>
            {message && <p>{message}</p>}

            <div className="social-login">
                <p>Or login with:</p>
                <button
                    onClick={() => (window.location.href = "http://localhost:3000/auth/google")}
                    className="social-button google">
                    Login with Google
                </button>
                <button
                    onClick={() => (window.location.href = "http://localhost:3000/auth/facebook")}
                    className="social-button facebook">
                    Login with Facebook
                </button>
            </div>
        </div>
    );
};

export default Login;
