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
import AdminService from "../services/adminService";

const AdminUsers = ({ user }) => {
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
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [userEditData, setUserEditData] = useState({
        role: "",
        is_active: true,
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        street_number: "",
        street_name: "",
        postal_code: "",
        city: "",
        country: "France",
    });

    useEffect(() => {
        if (user && user.id) {
            loadUsers();
        }
    }, [user?.id]);

    const loadUsers = async () => {
        if (!user || !user.id) {
            setError("User not authenticated");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");
            const data = await AdminService.getUsers();
            setUsers(data.users || []); // Extract users from response
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadUserDetails = async (userId) => {
        try {
            setDetailsLoading(true);
            const details = await AdminService.getUserDetails(userId);
            setUserDetails(details);
        } catch (err) {
            setError(err.message);
        } finally {
            setDetailsLoading(false);
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
            console.log("Updating user:", selectedUser.id, userEditData);
            await AdminService.updateUser(user.id, selectedUser.id, userEditData);
            console.log("User updated successfully");
            await loadUsers(); // Reload to get updated data
            setEditDialogOpen(false);
            setSelectedUser(null);
            setUserEditData({
                role: "",
                is_active: true,
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                date_of_birth: "",
                street_number: "",
                street_name: "",
                postal_code: "",
                city: "",
                country: "France",
            });
        } catch (err) {
            console.error("Error updating user:", err);
            setError(err.message);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            console.log("Deleting user:", selectedUser.id);
            await AdminService.deleteUser(user.id, selectedUser.id);
            console.log("User deleted successfully");
            setUsers(users.filter((u) => u.id !== selectedUser.id));
            setDeleteDialogOpen(false);
            setSelectedUser(null);
        } catch (err) {
            console.error("Error deleting user:", err);
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
                                                    onClick={async () => {
                                                        setSelectedUser(userItem);
                                                        await loadUserDetails(userItem.id);
                                                        setViewDialogOpen(true);
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
                                                                    first_name: userItem.first_name || "",
                                                                    last_name: userItem.last_name || "",
                                                                    email: userItem.email || "",
                                                                    phone: userItem.phone || "",
                                                                    date_of_birth: userItem.date_of_birth || "",
                                                                    street_number: userItem.street_number || "",
                                                                    street_name: userItem.street_name || "",
                                                                    postal_code: userItem.postal_code || "",
                                                                    city: userItem.city || "",
                                                                    country: userItem.country || "France",
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
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Modifier l'utilisateur: {selectedUser?.email}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            {/* Account Settings */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Paramètres du compte
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={userEditData.email}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
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
                            </Grid>

                            <Grid size={{ xs: 12 }}>
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
                                />
                            </Grid>

                            {/* Personal Information */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                                    Informations personnelles
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Prénom"
                                    value={userEditData.first_name}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            first_name: e.target.value,
                                        })
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Nom"
                                    value={userEditData.last_name}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            last_name: e.target.value,
                                        })
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Téléphone"
                                    value={userEditData.phone}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            phone: e.target.value,
                                        })
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Date de naissance"
                                    type="date"
                                    value={userEditData.date_of_birth}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            date_of_birth: e.target.value,
                                        })
                                    }
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            {/* Address Information */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                                    Adresse
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Numéro"
                                    value={userEditData.street_number}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            street_number: e.target.value,
                                        })
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 9 }}>
                                <TextField
                                    fullWidth
                                    label="Nom de rue"
                                    value={userEditData.street_name}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            street_name: e.target.value,
                                        })
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Code postal"
                                    value={userEditData.postal_code}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            postal_code: e.target.value,
                                        })
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Ville"
                                    value={userEditData.city}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            city: e.target.value,
                                        })
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Pays"
                                    value={userEditData.country}
                                    onChange={(e) =>
                                        setUserEditData({
                                            ...userEditData,
                                            country: e.target.value,
                                        })
                                    }
                                />
                            </Grid>
                        </Grid>
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

            {/* View User Details Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="h6">Détails de l'utilisateur</Typography>
                        <IconButton onClick={() => setViewDialogOpen(false)}>
                            <span>×</span>
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {detailsLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : userDetails ? (
                        <Grid container spacing={3}>
                            {/* User Info Card */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                            <Avatar
                                                src={userDetails.user.profile_picture}
                                                sx={{ width: 64, height: 64, mr: 2 }}>
                                                {getUserInitials(userDetails.user)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6">
                                                    {userDetails.user.first_name && userDetails.user.last_name
                                                        ? `${userDetails.user.first_name} ${userDetails.user.last_name}`
                                                        : "Nom non renseigné"}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {userDetails.user.email}
                                                </Typography>
                                                <Chip
                                                    icon={getRoleIcon(userDetails.user.role)}
                                                    label={AdminService.getStatusLabel(userDetails.user.role, "user")}
                                                    color={getRoleColor(userDetails.user.role)}
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                        </Box>

                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Informations de contact
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>Téléphone:</strong> {userDetails.user.phone || "Non renseigné"}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>Date de naissance:</strong>{" "}
                                            {userDetails.user.date_of_birth
                                                ? formatDate(userDetails.user.date_of_birth)
                                                : "Non renseignée"}
                                        </Typography>

                                        {(userDetails.user.street_name || userDetails.user.city) && (
                                            <>
                                                <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
                                                    Adresse
                                                </Typography>
                                                <Typography variant="body2">
                                                    {userDetails.user.street_number &&
                                                        `${userDetails.user.street_number} `}
                                                    {userDetails.user.street_name}
                                                    {userDetails.user.street_name && <br />}
                                                    {userDetails.user.postal_code && `${userDetails.user.postal_code} `}
                                                    {userDetails.user.city}
                                                    {userDetails.user.city && <br />}
                                                    {userDetails.user.country}
                                                </Typography>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Statistics Card */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ mb: 2 }}>
                                            Statistiques
                                        </Typography>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="body2">Événements créés:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                    {userDetails.user.events_count || 0}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="body2">Réservations:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                    {userDetails.user.bookings_count || 0}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="body2">Avis écrits:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                    {userDetails.user.reviews_count || 0}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="body2">Favoris:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                    {userDetails.user.favorites_count || 0}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="body2">Total dépensé:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                    {AdminService.formatCurrency(userDetails.user.total_spent || 0)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                                            Dates importantes
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>Inscription:</strong> {formatDate(userDetails.user.created_at)}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Statut:</strong> {userDetails.user.is_active ? "Actif" : "Inactif"}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Recent Activity */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ mb: 2 }}>
                                            Activité récente
                                        </Typography>

                                        {userDetails.recent_bookings && userDetails.recent_bookings.length > 0 && (
                                            <>
                                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                    Dernières réservations
                                                </Typography>
                                                {userDetails.recent_bookings.slice(0, 3).map((booking) => (
                                                    <Box
                                                        key={booking.id}
                                                        sx={{ mb: 1, p: 1, bgcolor: "grey.50", borderRadius: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                            {booking.event_title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDate(booking.booking_date)} -{" "}
                                                            {AdminService.formatCurrency(booking.total_price)}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </>
                                        )}

                                        {userDetails.created_events && userDetails.created_events.length > 0 && (
                                            <>
                                                <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
                                                    Événements créés
                                                </Typography>
                                                {userDetails.created_events.slice(0, 3).map((event) => (
                                                    <Box
                                                        key={event.id}
                                                        sx={{ mb: 1, p: 1, bgcolor: "grey.50", borderRadius: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                            {event.title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDate(event.event_date)} - {event.status}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </>
                                        )}

                                        {userDetails.recent_reviews && userDetails.recent_reviews.length > 0 && (
                                            <>
                                                <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
                                                    Avis récents
                                                </Typography>
                                                {userDetails.recent_reviews.slice(0, 2).map((review) => (
                                                    <Box
                                                        key={review.id}
                                                        sx={{ mb: 1, p: 1, bgcolor: "grey.50", borderRadius: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                            {review.event_title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {review.rating}/5 - {formatDate(review.created_at)}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    ) : (
                        <Typography>Aucune donnée disponible</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Fermer</Button>
                    {selectedUser && canEditUser(selectedUser) && (
                        <Button
                            variant="contained"
                            onClick={() => {
                                setViewDialogOpen(false);
                                // Populate edit form
                                setUserEditData({
                                    role: userDetails.user.role,
                                    is_active: userDetails.user.is_active,
                                    first_name: userDetails.user.first_name || "",
                                    last_name: userDetails.user.last_name || "",
                                    email: userDetails.user.email || "",
                                    phone: userDetails.user.phone || "",
                                    date_of_birth: userDetails.user.date_of_birth || "",
                                    street_number: userDetails.user.street_number || "",
                                    street_name: userDetails.user.street_name || "",
                                    postal_code: userDetails.user.postal_code || "",
                                    city: userDetails.user.city || "",
                                    country: userDetails.user.country || "France",
                                });
                                setEditDialogOpen(true);
                            }}>
                            Modifier
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminUsers;
