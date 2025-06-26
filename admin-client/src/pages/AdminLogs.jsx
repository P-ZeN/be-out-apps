import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Avatar,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Badge,
} from "@mui/material";
import {
    Search,
    FilterList,
    History,
    Person,
    Event,
    Receipt,
    AdminPanelSettings,
    Edit,
    Delete,
    Add,
    Visibility,
    Security,
    Warning,
    Info,
    Error,
    CheckCircle,
    Schedule,
    Download,
    Refresh,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import AdminService from "../services/adminService";
import { useTranslation } from "react-i18next";

const AdminLogs = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [adminFilter, setAdminFilter] = useState("all");
    const [uniqueAdmins, setUniqueAdmins] = useState([]);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await AdminService.getAdminLogs(user.id);
            setLogs(data);

            // Extract unique admins for filter
            const admins = [
                ...new Set(
                    data.map((log) => ({
                        id: log.admin_id,
                        email: log.admin_email,
                    }))
                ).values(),
            ];
            setUniqueAdmins(admins);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setPage(0);
    };

    const handleActionFilter = (action) => {
        setActionFilter(action);
        setPage(0);
    };

    const handleAdminFilter = (adminId) => {
        setAdminFilter(adminId);
        setPage(0);
    };

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            !searchTerm ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.admin_email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAction = actionFilter === "all" || log.action === actionFilter;
        const matchesAdmin = adminFilter === "all" || log.admin_id.toString() === adminFilter;

        return matchesSearch && matchesAction && matchesAdmin;
    });

    const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const getActionColor = (action) => {
        switch (action) {
            case "create_event":
            case "create_user":
            case "approve_event":
                return "success";
            case "delete_event":
            case "delete_user":
            case "reject_event":
            case "suspend_event":
                return "error";
            case "update_event":
            case "update_user":
            case "moderate_event":
                return "warning";
            case "view_dashboard":
            case "view_logs":
                return "info";
            default:
                return "default";
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case "create_event":
            case "update_event":
            case "delete_event":
            case "approve_event":
            case "reject_event":
            case "suspend_event":
            case "moderate_event":
                return <Event />;
            case "create_user":
            case "update_user":
            case "delete_user":
                return <Person />;
            case "update_booking":
                return <Receipt />;
            case "view_dashboard":
                return <AdminPanelSettings />;
            case "view_logs":
                return <History />;
            default:
                return <Info />;
        }
    };

    const getSeverityIcon = (action) => {
        const severity = getActionSeverity(action);
        switch (severity) {
            case "high":
                return <Error color="error" />;
            case "medium":
                return <Warning color="warning" />;
            case "low":
                return <Info color="info" />;
            default:
                return <CheckCircle color="success" />;
        }
    };

    const getActionSeverity = (action) => {
        if (action.includes("delete") || action.includes("suspend")) return "high";
        if (action.includes("reject") || action.includes("moderate")) return "medium";
        if (action.includes("view")) return "low";
        return "normal";
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getActionDisplayName = (action) => {
        const actionNames = {
            create_event: "Création d'événement",
            update_event: "Modification d'événement",
            delete_event: "Suppression d'événement",
            approve_event: "Approbation d'événement",
            reject_event: "Rejet d'événement",
            suspend_event: "Suspension d'événement",
            moderate_event: "Modération d'événement",
            create_user: "Création d'utilisateur",
            update_user: "Modification d'utilisateur",
            delete_user: "Suppression d'utilisateur",
            update_booking: "Modification de réservation",
            view_dashboard: "Consultation tableau de bord",
            view_logs: "Consultation des journaux",
        };
        return actionNames[action] || action;
    };

    const getUniqueActions = () => {
        return [...new Set(logs.map((log) => log.action))];
    };

    const getActionStats = () => {
        const stats = {};
        logs.forEach((log) => {
            stats[log.action] = (stats[log.action] || 0) + 1;
        });
        return stats;
    };

    const actionStats = getActionStats();

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
                    Journaux d'administration
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => {
                            /* TODO: Export logs */
                        }}>
                        Exporter
                    </Button>
                    <Button variant="contained" startIcon={<Refresh />} onClick={loadLogs}>
                        Actualiser
                    </Button>
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {/* Activity Summary */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Total d'actions
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                        {filteredLogs.length}
                                    </Typography>
                                </Box>
                                <History color="primary" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Actions critiques
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "error.main" }}>
                                        {filteredLogs.filter((log) => getActionSeverity(log.action) === "high").length}
                                    </Typography>
                                </Box>
                                <Error color="error" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Administrateurs actifs
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                        {uniqueAdmins.length}
                                    </Typography>
                                </Box>
                                <AdminPanelSettings color="info" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Dernière activité
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                        {logs.length > 0 ? formatDate(logs[0].created_at) : "Aucune"}
                                    </Typography>
                                </Box>
                                <Schedule color="warning" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher dans les actions, détails, admin..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Action</InputLabel>
                            <Select
                                value={actionFilter}
                                label="Action"
                                onChange={(e) => handleActionFilter(e.target.value)}>
                                <MenuItem value="all">Toutes</MenuItem>
                                {getUniqueActions().map((action) => (
                                    <MenuItem key={action} value={action}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                width: "100%",
                                            }}>
                                            <span>{getActionDisplayName(action)}</span>
                                            <Badge badgeContent={actionStats[action]} color="primary" />
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Administrateur</InputLabel>
                            <Select
                                value={adminFilter}
                                label="Administrateur"
                                onChange={(e) => handleAdminFilter(e.target.value)}>
                                <MenuItem value="all">Tous</MenuItem>
                                {uniqueAdmins.map((admin) => (
                                    <MenuItem key={admin.id} value={admin.id.toString()}>
                                        {admin.email}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            {filteredLogs.length} entrée(s)
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Loading */}
            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Logs Table */}
            {!loading && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Horodatage</TableCell>
                                <TableCell>Administrateur</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>Détails</TableCell>
                                <TableCell>Gravité</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedLogs.map((log) => (
                                <TableRow key={log.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <Schedule sx={{ mr: 1, fontSize: "0.875rem", color: "text.secondary" }} />
                                            <Typography variant="body2">{formatDate(log.created_at)}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                                                <AdminPanelSettings />
                                            </Avatar>
                                            <Typography variant="body2">{log.admin_email}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getActionIcon(log.action)}
                                            label={getActionDisplayName(log.action)}
                                            color={getActionColor(log.action)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                            {log.details.length > 100
                                                ? `${log.details.substring(0, 100)}...`
                                                : log.details}
                                        </Typography>
                                        {log.target_type && log.target_id && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ fontSize: "0.75rem", mt: 0.5 }}>
                                                {log.target_type} ID: {log.target_id}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={`Gravité: ${getActionSeverity(log.action)}`}>
                                            {getSeverityIcon(log.action)}
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={filteredLogs.length}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        labelRowsPerPage="Lignes par page:"
                    />
                </TableContainer>
            )}
        </Box>
    );
};

export default AdminLogs;
