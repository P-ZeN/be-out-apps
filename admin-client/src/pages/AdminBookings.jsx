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
    Divider,
} from "@mui/material";
import {
    Search,
    Visibility,
    Receipt,
    Person,
    Event,
    Schedule,
    Euro,
    ConfirmationNumber,
    CheckCircle,
    Cancel,
    Pending,
    LocalAtm,
    CreditCard,
    AccountBalanceWallet,
    Print,
    Email,
    Edit,
} from "@mui/icons-material";
import AdminService from "../services/adminService";

const AdminBookings = ({ user }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [bookingUpdate, setBookingUpdate] = useState({
        status: "",
        notes: "",
    });

    useEffect(() => {
        if (user && user.id) {
            loadBookings();
        }
    }, [user?.id]);

    const loadBookings = async () => {
        if (!user || !user.id) {
            setError("User not authenticated");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");
            const data = await AdminService.getBookings();
            setBookings(data.bookings || []); // Extract bookings array from response
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

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setPage(0);
    };

    const filteredBookings = bookings.filter((booking) => {
        const matchesSearch =
            !searchTerm ||
            booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.event_title.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const paginatedBookings = filteredBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleUpdateBooking = async () => {
        if (!selectedBooking) return;

        try {
            await AdminService.updateBooking(user.id, selectedBooking.id, bookingUpdate);
            await loadBookings(); // Reload to get updated data
            setUpdateDialogOpen(false);
            setSelectedBooking(null);
            setBookingUpdate({ status: "", notes: "" });
        } catch (err) {
            setError(err.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed":
                return "success";
            case "cancelled":
                return "error";
            case "pending":
                return "warning";
            case "refunded":
                return "info";
            default:
                return "default";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "confirmed":
                return <CheckCircle />;
            case "cancelled":
                return <Cancel />;
            case "pending":
                return <Pending />;
            case "refunded":
                return <AccountBalanceWallet />;
            default:
                return <Receipt />;
        }
    };

    const getPaymentIcon = (method) => {
        switch (method) {
            case "card":
                return <CreditCard />;
            case "paypal":
                return <AccountBalanceWallet />;
            case "cash":
                return <LocalAtm />;
            default:
                return <Euro />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatEventDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const calculateTotalRevenue = () => {
        return filteredBookings
            .filter((booking) => booking.status === "confirmed")
            .reduce((sum, booking) => sum + parseFloat(booking.total_amount || 0), 0);
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
                    Gestion des réservations
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={() => {
                            /* TODO: Export to PDF */
                        }}>
                        Exporter
                    </Button>
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Total réservations
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                        {filteredBookings.length}
                                    </Typography>
                                </Box>
                                <Receipt color="primary" />
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
                                        Confirmées
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "success.main" }}>
                                        {filteredBookings.filter((b) => b.status === "confirmed").length}
                                    </Typography>
                                </Box>
                                <CheckCircle color="success" />
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
                                        En attente
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "warning.main" }}>
                                        {filteredBookings.filter((b) => b.status === "pending").length}
                                    </Typography>
                                </Box>
                                <Pending color="warning" />
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
                                        Chiffre d'affaires
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                        {AdminService.formatCurrency(calculateTotalRevenue())}
                                    </Typography>
                                </Box>
                                <Euro color="primary" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher par référence, email, événement..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Statut</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Statut"
                                onChange={(e) => handleStatusFilter(e.target.value)}>
                                <MenuItem value="all">Tous</MenuItem>
                                <MenuItem value="confirmed">Confirmée</MenuItem>
                                <MenuItem value="pending">En attente</MenuItem>
                                <MenuItem value="cancelled">Annulée</MenuItem>
                                <MenuItem value="refunded">Remboursée</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            {filteredBookings.length} réservation(s) trouvée(s)
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

            {/* Bookings Table */}
            {!loading && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Référence</TableCell>
                                <TableCell>Client</TableCell>
                                <TableCell>Événement</TableCell>
                                <TableCell>Tickets</TableCell>
                                <TableCell>Montant</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedBookings.map((booking) => (
                                <TableRow key={booking.id} hover>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                                                {booking.booking_reference}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(booking.created_at)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                                                <Person />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                    {booking.user_name || "N/A"}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ fontSize: "0.75rem" }}>
                                                    {booking.user_email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                {booking.event_title}
                                            </Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                                                <Schedule
                                                    sx={{ mr: 0.5, fontSize: "0.75rem", color: "text.secondary" }}
                                                />
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ fontSize: "0.75rem" }}>
                                                    {formatEventDate(booking.event_date)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <ConfirmationNumber
                                                sx={{ mr: 0.5, fontSize: "0.875rem", color: "text.secondary" }}
                                            />
                                            <Typography variant="body2">{booking.ticket_quantity} ticket(s)</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                {AdminService.formatCurrency(booking.total_amount)}
                                            </Typography>
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                {getPaymentIcon(booking.payment_method)}
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ fontSize: "0.75rem", ml: 0.5 }}>
                                                    {AdminService.getStatusLabel(booking.payment_method, "payment")}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getStatusIcon(booking.status)}
                                            label={AdminService.getStatusLabel(booking.status, "booking")}
                                            color={getStatusColor(booking.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <Tooltip title="Voir détails">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setDetailDialogOpen(true);
                                                    }}>
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Modifier">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setBookingUpdate({
                                                            status: booking.status,
                                                            notes: booking.admin_notes || "",
                                                        });
                                                        setUpdateDialogOpen(true);
                                                    }}>
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Envoyer email">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        /* TODO: Send email */
                                                    }}>
                                                    <Email />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={filteredBookings.length}
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

            {/* Booking Detail Dialog */}
            <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Détails de la réservation: {selectedBooking?.booking_reference}</DialogTitle>
                <DialogContent>
                    {selectedBooking && (
                        <Box sx={{ pt: 2 }}>
                            <Grid container spacing={3}>
                                {/* Customer Info */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Client
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Email
                                        </Typography>
                                        <Typography variant="body1">{selectedBooking.user_email}</Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Nom
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedBooking.user_name || "Non renseigné"}
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* Event Info */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Événement
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Titre
                                        </Typography>
                                        <Typography variant="body1">{selectedBooking.event_title}</Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Date
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatEventDate(selectedBooking.event_date)}
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* Booking Details */}
                                <Grid size={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        Détails de la réservation
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Quantité
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedBooking.ticket_quantity} ticket(s)
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Prix unitaire
                                            </Typography>
                                            <Typography variant="body1">
                                                {AdminService.formatCurrency(selectedBooking.unit_price)}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Total
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                                {AdminService.formatCurrency(selectedBooking.total_amount)}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Paiement
                                            </Typography>
                                            <Typography variant="body1">
                                                {AdminService.getStatusLabel(selectedBooking.payment_method, "payment")}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Notes */}
                                {selectedBooking.admin_notes && (
                                    <Grid size={12}>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            Notes administratives
                                        </Typography>
                                        <Typography variant="body1">{selectedBooking.admin_notes}</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* Update Booking Dialog */}
            <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Modifier la réservation: {selectedBooking?.booking_reference}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Statut</InputLabel>
                            <Select
                                value={bookingUpdate.status}
                                label="Statut"
                                onChange={(e) =>
                                    setBookingUpdate({
                                        ...bookingUpdate,
                                        status: e.target.value,
                                    })
                                }>
                                <MenuItem value="confirmed">Confirmée</MenuItem>
                                <MenuItem value="pending">En attente</MenuItem>
                                <MenuItem value="cancelled">Annulée</MenuItem>
                                <MenuItem value="refunded">Remboursée</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Notes administratives"
                            value={bookingUpdate.notes}
                            onChange={(e) =>
                                setBookingUpdate({
                                    ...bookingUpdate,
                                    notes: e.target.value,
                                })
                            }
                            placeholder="Ajoutez des notes sur cette réservation..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUpdateDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleUpdateBooking} variant="contained">
                        Sauvegarder
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminBookings;
