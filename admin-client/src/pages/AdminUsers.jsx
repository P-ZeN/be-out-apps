import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
    Switch,
    FormControlLabel,
} from "@mui/material";
import {
    Edit,
    Delete,
    Visibility,
    Search,
    Person,
    Email,
    CalendarToday,
    AdminPanelSettings,
    Block,
    CheckCircle,
    Security,
    Assignment,
    SupervisorAccount,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import AdminService from "../services/adminService";
import { useTranslation } from "react-i18next";

const AdminUsers = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [selectedUser, setSelectedUser] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userEditData, setUserEditData] = useState({
        role: "",
        is_active: true,
        notes: "",
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await AdminService.getUsers(user.id);
            setUsers(data);
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

    const handleRoleFilter = (role) => {
        setRoleFilter(role);
        setPage(0);
    };

    const filteredUsers = users.filter((userItem) => {
        const matchesSearch =
            !searchTerm ||
            userItem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (userItem.first_name && userItem.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (userItem.last_name && userItem.last_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = roleFilter === "all" || userItem.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            await AdminService.updateUser(user.id, selectedUser.id, userEditData);
            await loadUsers(); // Reload to get updated data
            setEditDialogOpen(false);
            setSelectedUser(null);
            setUserEditData({ role: "", is_active: true, notes: "" });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            await AdminService.deleteUser(user.id, selectedUser.id);
            setUsers(users.filter((u) => u.id !== selectedUser.id));
            setDeleteDialogOpen(false);
            setSelectedUser(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case "admin":
                return "error";
            case "moderator":
                return "warning";
            case "organizer":
                return "info";
            case "user":
                return "default";
            default:
                return "default";
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case "admin":
                return <AdminPanelSettings />;
            case "moderator":
                return <Security />;
            case "organizer":
                return <Assignment />;
            case "user":
                return <Person />;
            default:
                return <Person />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getUserInitials = (userItem) => {
        const firstName = userItem.first_name || "";
        const lastName = userItem.last_name || "";
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || userItem.email.charAt(0).toUpperCase();
    };

    const canEditUser = (targetUser) => {
        // Admin can edit anyone except themselves
        // Don't allow deleting the last admin
        return targetUser.id !== user.id;
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
                    Gestion des utilisateurs
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<SupervisorAccount />}
                    onClick={() => {
                        /* TODO: Implement add user */
                    }}>
                    Nouvel utilisateur
                </Button>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher par email, nom, prénom..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Rôle</InputLabel>
                            <Select value={roleFilter} label="Rôle" onChange={(e) => handleRoleFilter(e.target.value)}>
                                <MenuItem value="all">Tous</MenuItem>
                                <MenuItem value="admin">Administrateur</MenuItem>
                                <MenuItem value="moderator">Modérateur</MenuItem>
                                <MenuItem value="organizer">Organisateur</MenuItem>
                                <MenuItem value="user">Utilisateur</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            {filteredUsers.length} utilisateur(s) trouvé(s)
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

            {/* Users Table */}
            {!loading && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Utilisateur</TableCell>
                                <TableCell>Rôle</TableCell>
                                <TableCell>Date d'inscription</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Statistiques</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedUsers.map((userItem) => (
                                <TableRow key={userItem.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <Avatar
                                                src={userItem.profile_picture}
                                                sx={{ mr: 2, width: 40, height: 40 }}>
                                                {getUserInitials(userItem)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                                                    {userItem.first_name && userItem.last_name
                                                        ? `${userItem.first_name} ${userItem.last_name}`
                                                        : "Nom non renseigné"}
                                                </Typography>
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    <Email
                                                        sx={{ mr: 0.5, fontSize: "0.75rem", color: "text.secondary" }}
                                                    />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {userItem.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getRoleIcon(userItem.role)}
                                            label={AdminService.getStatusLabel(userItem.role, "user")}
                                            color={getRoleColor(userItem.role)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <CalendarToday
                                                sx={{ mr: 1, fontSize: "0.875rem", color: "text.secondary" }}
                                            />
                                            <Typography variant="body2">{formatDate(userItem.created_at)}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={userItem.is_active ? <CheckCircle /> : <Block />}
                                            label={userItem.is_active ? "Actif" : "Inactif"}
                                            color={userItem.is_active ? "success" : "error"}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                                                Événements: {userItem.events_count || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                                                Réservations: {userItem.bookings_count || 0}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <Tooltip title="Voir profil">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        /* TODO: Open user profile */
                                                    }}>
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            {canEditUser(userItem) && (
                                                <>
                                                    <Tooltip title="Modifier">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedUser(userItem);
                                                                setUserEditData({
                                                                    role: userItem.role,
                                                                    is_active: userItem.is_active,
                                                                    notes: userItem.admin_notes || "",
                                                                });
                                                                setEditDialogOpen(true);
                                                            }}>
                                                            <Edit />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Supprimer">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => {
                                                                setSelectedUser(userItem);
                                                                setDeleteDialogOpen(true);
                                                            }}>
                                                            <Delete />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={filteredUsers.length}
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

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Modifier l'utilisateur: {selectedUser?.email}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Rôle</InputLabel>
                            <Select
                                value={userEditData.role}
                                label="Rôle"
                                onChange={(e) =>
                                    setUserEditData({
                                        ...userEditData,
                                        role: e.target.value,
                                    })
                                }>
                                <MenuItem value="admin">Administrateur</MenuItem>
                                <MenuItem value="moderator">Modérateur</MenuItem>
                                <MenuItem value="organizer">Organisateur</MenuItem>
                                <MenuItem value="user">Utilisateur</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={userEditData.is_active}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            is_active: e.target.checked,
                                        })
                                    }
                                />
                            }
                            label="Compte actif"
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Notes administratives"
                            value={userEditData.notes}
                            onChange={(e) =>
                                setUserEditData({
                                    ...userEditData,
                                    notes: e.target.value,
                                })
                            }
                            placeholder="Ajoutez des notes sur cet utilisateur..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleUpdateUser} variant="contained">
                        Sauvegarder
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer l'utilisateur "{selectedUser?.email}" ? Cette action
                        supprimera également tous ses événements et réservations.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleDeleteUser} color="error" variant="contained">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminUsers;
