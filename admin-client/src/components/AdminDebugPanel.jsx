import React, { useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    TextField,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    NetworkCheck as NetworkIcon,
    Security as SecurityIcon,
    Api as ApiIcon,
} from "@mui/icons-material";
import AuthService from "../services/authService";

// Debug helper component for troubleshooting admin API issues
const AdminDebugPanel = () => {
    const [testResults, setTestResults] = useState({});
    const [loading, setLoading] = useState(false);
    const [customUrl, setCustomUrl] = useState(import.meta.env.VITE_API_URL || "http://localhost:3000");

    const runTests = async () => {
        setLoading(true);
        const results = {};

        // Test 1: Authentication status
        results.auth = {
            hasToken: !!AuthService.getToken(),
            isAuthenticated: AuthService.isAuthenticated(),
            user: AuthService.getCurrentUser(),
            token: AuthService.getToken(),
        };

        // Test 2: Network connectivity
        try {
            const response = await fetch(`${customUrl}/api/events/meta/categories`);
            results.network = {
                success: response.ok,
                status: response.status,
                url: `${customUrl}/api/events/meta/categories`,
            };
        } catch (error) {
            results.network = {
                success: false,
                error: error.message,
                url: `${customUrl}/api/events/meta/categories`,
            };
        }

        // Test 3: Admin API access
        try {
            const token = AuthService.getToken();
            const response = await fetch(`${customUrl}/api/admin/categories`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                results.adminApi = {
                    success: true,
                    status: response.status,
                    categoriesCount: Array.isArray(data) ? data.length : "Invalid response",
                };
            } else {
                results.adminApi = {
                    success: false,
                    status: response.status,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            }
        } catch (error) {
            results.adminApi = {
                success: false,
                error: error.message,
            };
        }

        setTestResults(results);
        setLoading(false);
    };

    const TestResult = ({ title, result, icon }) => (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                {icon}
                <Typography variant="h6">{title}</Typography>
                <Chip
                    label={result?.success ? "OK" : "ERREUR"}
                    color={result?.success ? "success" : "error"}
                    size="small"
                />
            </Box>
            <Box sx={{ pl: 4 }}>
                {Object.entries(result || {}).map(([key, value]) => (
                    <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                        <strong>{key}:</strong>{" "}
                        {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                    </Typography>
                ))}
            </Box>
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                🔧 Panel de Debug Admin
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Utilisez ce panel pour diagnostiquer les problèmes de connexion à l'API admin.
            </Typography>

            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    label="URL du serveur"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    helperText="Modifiez si votre serveur utilise un port différent"
                    sx={{ mb: 2 }}
                />
                <Button variant="contained" onClick={runTests} disabled={loading} startIcon={<NetworkIcon />}>
                    {loading ? "Test en cours..." : "Lancer les tests de diagnostic"}
                </Button>
            </Box>

            {Object.keys(testResults).length > 0 && (
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Résultats des tests:
                    </Typography>

                    <TestResult
                        title="Authentification"
                        result={testResults.auth}
                        icon={<SecurityIcon color={testResults.auth?.isAuthenticated ? "success" : "error"} />}
                    />

                    <TestResult
                        title="Connectivité réseau"
                        result={testResults.network}
                        icon={<NetworkIcon color={testResults.network?.success ? "success" : "error"} />}
                    />

                    <TestResult
                        title="API Admin"
                        result={testResults.adminApi}
                        icon={<ApiIcon color={testResults.adminApi?.success ? "success" : "error"} />}
                    />

                    <Accordion sx={{ mt: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2">Solutions courantes</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box>
                                <Typography variant="body2" paragraph>
                                    <strong>Si "Authentification" échoue:</strong>
                                </Typography>
                                <ul>
                                    <li>Déconnectez-vous et reconnectez-vous</li>
                                    <li>Vérifiez que vous avez les droits admin/moderator</li>
                                    <li>Videz le localStorage du navigateur</li>
                                </ul>

                                <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                                    <strong>Si "Connectivité réseau" échoue:</strong>
                                </Typography>
                                <ul>
                                    <li>Vérifiez que le serveur backend est démarré</li>
                                    <li>Vérifiez l'URL (par défaut: {import.meta.env.VITE_API_URL || "http://localhost:3000"})</li>
                                    <li>Vérifiez les règles CORS du serveur</li>
                                </ul>

                                <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                                    <strong>Si "API Admin" échoue:</strong>
                                </Typography>
                                <ul>
                                    <li>Vérifiez que les routes admin sont bien déployées</li>
                                    <li>Vérifiez les logs du serveur backend</li>
                                    <li>Status 401/403: problème de permissions</li>
                                    <li>Status 404: route non trouvée</li>
                                    <li>Status 500: erreur serveur (vérifiez les logs)</li>
                                </ul>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Paper>
            )}
        </Box>
    );
};

export default AdminDebugPanel;
