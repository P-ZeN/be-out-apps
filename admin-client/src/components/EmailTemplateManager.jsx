import React, { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    Chip,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    Card,
    CardContent,
    Grid,
    InputAdornment,
    Tooltip,
    MenuItem,
} from "@mui/material";
import { Add, Edit, Delete, Send, Preview, Code, Email, Search, Refresh } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

// Monaco Editor - using a simpler approach
const CodeEditor = ({ value, onChange, language = "html", height = "300px" }) => {
    return (
        <TextField
            multiline
            rows={12}
            fullWidth
            value={value}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
            sx={{
                "& .MuiInputBase-root": {
                    fontFamily: "monospace",
                    fontSize: "14px",
                },
            }}
        />
    );
};

const EmailTemplateManager = () => {
    const theme = useTheme();
    const [templates, setTemplates] = useState([]);
    const [logs, setLogs] = useState([]);
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState(0); // Start with Email Logs tab (now index 0)
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("fr"); // Default to French
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Available languages
    const availableLanguages = [
        { code: "en", name: "English", flag: "🇺🇸" },
        { code: "fr", name: "Français", flag: "🇫🇷" },
        { code: "es", name: "Español", flag: "🇪🇸" },
    ];

    // API configuration
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const getAuthHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        language: "en",
        subject: "",
        body: "",
        description: "",
        variables: "{}",
        is_active: true,
    });

    // Test email state
    const [testEmail, setTestEmail] = useState("");
    const [testVariables, setTestVariables] = useState("{}");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [selectedLanguage]);

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchTemplates(), fetchLogs(), fetchSettings()]);
        } catch (error) {
            showSnackbar("Error fetching data", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        const response = await fetch(`${API_BASE_URL}/api/emails/templates?language=${selectedLanguage}`, {
            headers: getAuthHeaders(),
        });
        if (response.ok) {
            const data = await response.json();
            setTemplates(data);
        }
    };

    const fetchLogs = async () => {
        const response = await fetch(`${API_BASE_URL}/api/emails/logs?limit=100`, {
            headers: getAuthHeaders(),
        });
        if (response.ok) {
            const data = await response.json();
            setLogs(data.logs);
        }
    };

    const fetchSettings = async () => {
        const response = await fetch(`${API_BASE_URL}/api/emails/settings`, {
            headers: getAuthHeaders(),
        });
        if (response.ok) {
            const data = await response.json();
            setSettings(data);
        }
    };

    const handleOpenDialog = (template = null) => {
        if (template) {
            setSelectedTemplate(template);
            setFormData({
                name: template.name,
                language: template.language,
                subject: template.subject,
                body: template.body,
                description: template.description || "",
                variables: JSON.stringify(template.variables || {}, null, 2),
                is_active: template.is_active,
            });
            setIsEditing(true);
        } else {
            setSelectedTemplate(null);
            setFormData({
                name: "",
                language: selectedLanguage,
                subject: "",
                body: "",
                description: "",
                variables: "{}",
                is_active: true,
            });
            setIsEditing(false);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedTemplate(null);
        setFormData({
            name: "",
            language: selectedLanguage,
            subject: "",
            body: "",
            description: "",
            variables: "{}",
            is_active: true,
        });
    };

    const handleSaveTemplate = async () => {
        try {
            let variables = {};
            try {
                variables = JSON.parse(formData.variables);
            } catch (error) {
                showSnackbar("Invalid JSON in variables field", "error");
                return;
            }

            const payload = {
                ...formData,
                variables,
            };

            const url = isEditing
                ? `${API_BASE_URL}/api/emails/templates/${selectedTemplate.id}`
                : `${API_BASE_URL}/api/emails/templates`;

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                showSnackbar(isEditing ? "Template updated successfully" : "Template created successfully", "success");
                handleCloseDialog();
                fetchTemplates();
            } else {
                const error = await response.json();
                showSnackbar(error.error || "Failed to save template", "error");
            }
        } catch (error) {
            showSnackbar("Error saving template", "error");
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!confirm("Are you sure you want to delete this template?")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/emails/templates/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                showSnackbar("Template deleted successfully", "success");
                fetchTemplates();
            } else {
                const error = await response.json();
                showSnackbar(error.error || "Failed to delete template", "error");
            }
        } catch (error) {
            showSnackbar("Error deleting template", "error");
        }
    };

    const handleTestEmail = async () => {
        try {
            let variables = {};
            try {
                variables = JSON.parse(testVariables);
            } catch (error) {
                showSnackbar("Invalid JSON in test variables", "error");
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/emails/templates/${selectedTemplate.id}/test`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    email: testEmail,
                    variables,
                }),
            });

            if (response.ok) {
                showSnackbar("Test email sent successfully", "success");
                setTestDialogOpen(false);
                setTestEmail("");
                setTestVariables("{}");
            } else {
                const error = await response.json();
                showSnackbar(error.error || "Failed to send test email", "error");
            }
        } catch (error) {
            showSnackbar("Error sending test email", "error");
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const filteredTemplates = templates.filter(
        (template) =>
            template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case "sent":
                return "success";
            case "failed":
                return "error";
            case "bounced":
                return "warning";
            default:
                return "default";
        }
    };

    return (
        <Box sx={{ p: 0 }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Logs d'emails" />
                <Tab label="Templates" />
                <Tab label="Paramètres" />
            </Tabs>

            {/* Email Logs Tab */}
            {currentTab === 0 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Recent Email Activity
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Recipient</TableCell>
                                    <TableCell>Template</TableCell>
                                    <TableCell>Subject</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Sent</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{log.recipient}</TableCell>
                                        <TableCell>{log.template_name}</TableCell>
                                        <TableCell>{log.subject}</TableCell>
                                        <TableCell>
                                            <Chip label={log.status} color={getStatusColor(log.status)} size="small" />
                                        </TableCell>
                                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Templates Tab */}
            {currentTab === 1 && (
                <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <TextField
                                placeholder="Search templates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ width: 300 }}
                            />
                            <TextField
                                select
                                label="Language"
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                sx={{ width: 150 }}>
                                {availableLanguages.map((lang) => (
                                    <MenuItem key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box>
                            <Button variant="outlined" onClick={fetchTemplates} startIcon={<Refresh />} sx={{ mr: 1 }}>
                                Refresh
                            </Button>
                            <Button variant="contained" onClick={() => handleOpenDialog()} startIcon={<Add />}>
                                Add Template
                            </Button>
                        </Box>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Language</TableCell>
                                    <TableCell>Subject</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTemplates.map((template) => (
                                    <TableRow key={`${template.name}-${template.language}`}>
                                        <TableCell>
                                            <Typography variant="subtitle2">{template.name}</Typography>
                                            {template.description && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {template.description}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={
                                                    availableLanguages.find((l) => l.code === template.language)?.flag +
                                                    " " +
                                                    template.language.toUpperCase()
                                                }
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{template.subject}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={template.is_active ? "Active" : "Inactive"}
                                                color={template.is_active ? "success" : "default"}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleOpenDialog(template)}>
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Test Email">
                                                <IconButton
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        setTestDialogOpen(true);
                                                    }}>
                                                    <Send />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton onClick={() => handleDeleteTemplate(template.id)}>
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Settings Tab */}
            {currentTab === 2 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Email Settings
                    </Typography>
                    <Grid container spacing={3}>
                        {settings.map((setting) => (
                            <Grid item xs={12} md={6} key={setting.id}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6">{setting.setting_key}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {setting.description}
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            value={setting.setting_value}
                                            onChange={(e) => {
                                                const newSettings = settings.map((s) =>
                                                    s.id === setting.id ? { ...s, setting_value: e.target.value } : s
                                                );
                                                setSettings(newSettings);
                                            }}
                                            size="small"
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Template Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
                <DialogTitle>{isEditing ? "Edit Template" : "Create Template"}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Template Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Language"
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    required>
                                    {availableLanguages.map((lang) => (
                                        <MenuItem key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                    }
                                    label="Active"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Email Body (HTML)
                                </Typography>
                                <CodeEditor
                                    value={formData.body}
                                    onChange={(value) => setFormData({ ...formData, body: value })}
                                    language="html"
                                    height="400px"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Variables (JSON)
                                </Typography>
                                <CodeEditor
                                    value={formData.variables}
                                    onChange={(value) => setFormData({ ...formData, variables: value })}
                                    language="json"
                                    height="150px"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveTemplate} variant="contained">
                        {isEditing ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Test Email Dialog */}
            <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Test Email Template</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Test Email Address"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            type="email"
                            required
                            sx={{ mb: 2 }}
                        />
                        <Typography variant="subtitle2" gutterBottom>
                            Test Variables (JSON)
                        </Typography>
                        <CodeEditor
                            value={testVariables}
                            onChange={(value) => setTestVariables(value)}
                            language="json"
                            height="200px"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTestDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleTestEmail} variant="contained" startIcon={<Send />}>
                        Send Test Email
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default EmailTemplateManager;
