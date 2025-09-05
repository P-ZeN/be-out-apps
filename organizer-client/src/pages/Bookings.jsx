import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    TextField,
    InputAdornment,
    Button,
    Menu,
    MenuItem,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    Divider,
    Alert,
    CircularProgress,
    Tooltip,
    Stack
} from "@mui/material";
import {
    Search,
    FilterList,
    Download,
    Visibility,
    Email,
    Phone,
    Schedule,
    LocationOn,
    Person,
    Euro,
    Close,
    Refresh
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import organizerService from "../services/organizerService";

const Bookings = () => {
    const { t } = useTranslation('organizer');

    // State management
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Filters and search
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [eventFilter, setEventFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    // UI state
    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    // Events list for filtering
    const [events, setEvents] = useState([]);

    // Load data
    useEffect(() => {
        loadBookings();
        loadEvents();
    }, [page, rowsPerPage, searchTerm, statusFilter, eventFilter, dateFilter]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const filters = {
                page: page + 1,
                limit: rowsPerPage,
                search: searchTerm,
                status: statusFilter,
                event_id: eventFilter,
                date: dateFilter
            };

            const data = await organizerService.getBookings(filters);
            setBookings(data.bookings || data);
            setTotalCount(data.total || (data.bookings ? data.bookings.length : data.length));
        } catch (err) {
            setError(t('bookings.errors.loadFailed'));
            console.error("Error loading bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadEvents = async () => {
        try {
            const data = await organizerService.getEvents();
            setEvents(data.events || data);
        } catch (err) {
            console.error("Error loading events:", err);
        }
    };

    // Helper functions
    const getStatusColor = (status) => {
        const statusColors = {
            confirmed: "success",
            pending: "warning",
            cancelled: "error",
            refunded: "secondary"
        };
        return statusColors[status] || "default";
    };

    const getStatusLabel = (status) => {
        const statusLabels = {
            confirmed: t('bookings.status.confirmed'),
            pending: t('bookings.status.pending'),
            cancelled: t('bookings.status.cancelled'),
            refunded: t('bookings.status.refunded')
        };
        return statusLabels[status] || status;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR"
        }).format(amount);
    };

    // Event handlers
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setDetailDialogOpen(true);
    };

    const handleExport = async () => {
        try {
            // This would be implemented with a proper export API
            const filters = {
                search: searchTerm,
                status: statusFilter,
                event_id: eventFilter,
                date: dateFilter
            };

            // For now, just log the action
            console.log("Exporting bookings with filters:", filters);

            // TODO: Implement actual CSV/Excel export
            alert(t('bookings.export.notImplemented'));
        } catch (err) {
            console.error("Export error:", err);
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        setEventFilter("");
        setDateFilter("");
        setPage(0);
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {t('bookings.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('bookings.subtitle')}
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {/* Search and Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                placeholder={t('bookings.search.placeholder')}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t('bookings.filters.status')}</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label={t('bookings.filters.status')}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="">{t('bookings.filters.all')}</MenuItem>
                                    <MenuItem value="confirmed">{t('bookings.status.confirmed')}</MenuItem>
                                    <MenuItem value="pending">{t('bookings.status.pending')}</MenuItem>
                                    <MenuItem value="cancelled">{t('bookings.status.cancelled')}</MenuItem>
                                    <MenuItem value="refunded">{t('bookings.status.refunded')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t('bookings.filters.event')}</InputLabel>
                                <Select
                                    value={eventFilter}
                                    label={t('bookings.filters.event')}
                                    onChange={(e) => setEventFilter(e.target.value)}
                                >
                                    <MenuItem value="">{t('bookings.filters.all')}</MenuItem>
                                    {events.map((event) => (
                                        <MenuItem key={event.id} value={event.id}>
                                            {event.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Download />}
                                    onClick={handleExport}
                                    sx={{ minWidth: 120 }}
                                >
                                    {t('bookings.export.button')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Refresh />}
                                    onClick={loadBookings}
                                >
                                    {t('bookings.refresh')}
                                </Button>
                                {(searchTerm || statusFilter || eventFilter || dateFilter) && (
                                    <Button
                                        variant="text"
                                        onClick={clearFilters}
                                    >
                                        {t('bookings.clearFilters')}
                                    </Button>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Bookings Table */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('bookings.table.reference')}</TableCell>
                                <TableCell>{t('bookings.table.customer')}</TableCell>
                                <TableCell>{t('bookings.table.event')}</TableCell>
                                <TableCell>{t('bookings.table.date')}</TableCell>
                                <TableCell>{t('bookings.table.quantity')}</TableCell>
                                <TableCell>{t('bookings.table.amount')}</TableCell>
                                <TableCell>{t('bookings.table.status')}</TableCell>
                                <TableCell>{t('bookings.table.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : bookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            {t('bookings.empty')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bookings.map((booking) => (
                                    <TableRow key={booking.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                                {booking.booking_reference}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                    {booking.customer_name || booking.user_name || "N/A"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {booking.customer_email || booking.user_email}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                {booking.event_title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDate(booking.booking_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {booking.quantity}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                {formatCurrency(booking.total_price)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(booking.booking_status)}
                                                color={getStatusColor(booking.booking_status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewDetails(booking)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    labelRowsPerPage={t('bookings.pagination.rowsPerPage')}
                />
            </Card>

            {/* Booking Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h6">
                            {t('bookings.details.title')}
                        </Typography>
                        <IconButton onClick={() => setDetailDialogOpen(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    {selectedBooking && (
                        <Grid container spacing={3}>
                            {/* Booking Info */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6" gutterBottom>
                                    {t('bookings.details.bookingInfo')}
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('bookings.details.reference')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                                        {selectedBooking.booking_reference}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('bookings.details.status')}
                                    </Typography>
                                    <Chip
                                        label={getStatusLabel(selectedBooking.booking_status)}
                                        color={getStatusColor(selectedBooking.booking_status)}
                                        size="small"
                                    />
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('bookings.details.bookingDate')}
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(selectedBooking.booking_date)}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('bookings.details.quantity')}
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedBooking.quantity} {t('bookings.details.tickets')}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('bookings.details.totalAmount')}
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        {formatCurrency(selectedBooking.total_price)}
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* Customer Info */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6" gutterBottom>
                                    {t('bookings.details.customerInfo')}
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                        <Person sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {t('bookings.details.name')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        {selectedBooking.customer_name || selectedBooking.user_name || "N/A"}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                        <Email sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {t('bookings.details.email')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        {selectedBooking.customer_email || selectedBooking.user_email}
                                    </Typography>
                                </Box>

                                {selectedBooking.customer_phone && (
                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                            <Phone sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {t('bookings.details.phone')}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1">
                                            {selectedBooking.customer_phone}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>

                            {/* Event Info */}
                            <Grid size={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    {t('bookings.details.eventInfo')}
                                </Typography>

                                <Typography variant="body1" sx={{ fontWeight: "medium", mb: 1 }}>
                                    {selectedBooking.event_title}
                                </Typography>

                                {selectedBooking.event_date && (
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                        <Schedule sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                                        <Typography variant="body2">
                                            {formatDate(selectedBooking.event_date)}
                                        </Typography>
                                    </Box>
                                )}

                                {selectedBooking.special_requests && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {t('bookings.details.specialRequests')}
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedBooking.special_requests}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>
                        {t('bookings.details.close')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Bookings;
