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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Divider,
    Tooltip,
} from "@mui/material";
import {
    Search,
    Visibility,
    CreditCard,
    TrendingUp,
    AttachMoney,
    Warning,
    Refresh,
    GetApp,
    Receipt,
    AccountBalance,
    Error as ErrorIcon,
    CheckCircle,
    AccessTime,
    Undo,
} from "@mui/icons-material";
import PaymentService from "../services/paymentService";

const AdminPayments = ({ user }) => {
    const [payments, setPayments] = useState([]);
    const [paymentStats, setPaymentStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [refundAmount, setRefundAmount] = useState("");
    const [refundReason, setRefundReason] = useState("");

    useEffect(() => {
        loadPaymentData();
    }, []);

    const loadPaymentData = async () => {
        try {
            setLoading(true);
            setError("");

            const [paymentsData, statsData] = await Promise.all([
                PaymentService.getPaymentTransactions({
                    page: page + 1,
                    limit: rowsPerPage,
                    status: statusFilter === "all" ? "" : statusFilter,
                    search: searchTerm,
                }),
                PaymentService.getPaymentStats(),
            ]);

            setPayments(paymentsData.payments || []);
            setPaymentStats(statsData);
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

    const handleRefund = async () => {
        try {
            setLoading(true);
            await PaymentService.processRefund(
                selectedPayment.stripe_payment_id,
                Math.round(parseFloat(refundAmount) * 100), // Convert to cents
                refundReason
            );

            setRefundDialogOpen(false);
            setSelectedPayment(null);
            setRefundAmount("");
            setRefundReason("");
            await loadPaymentData();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter((payment) => {
        const matchesSearch =
            !searchTerm ||
            payment.stripe_payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.event_title.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const paginatedPayments = filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const getStatusIcon = (status) => {
        switch (status) {
            case "succeeded":
                return <CheckCircle color="success" />;
            case "pending":
                return <AccessTime color="warning" />;
            case "failed":
                return <ErrorIcon color="error" />;
            case "refunded":
            case "partially_refunded":
                return <Undo color="info" />;
            default:
                return <Receipt />;
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

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
                    Gestion des paiements
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button variant="outlined" startIcon={<Refresh />} onClick={loadPaymentData}>
                        Actualiser
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<GetApp />}
                        onClick={() => {
                            /* TODO: Export to Excel */
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

            {/* Statistics Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Paiements réussis
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "success.main" }}>
                                        {paymentStats.successful_payments || 0}
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
                                        Chiffre d'affaires
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                        {PaymentService.formatCurrency(paymentStats.total_revenue || 0)}
                                    </Typography>
                                </Box>
                                <TrendingUp color="primary" />
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
                                        Paiements échoués
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "error.main" }}>
                                        {paymentStats.failed_payments || 0}
                                    </Typography>
                                </Box>
                                <ErrorIcon color="error" />
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
                                        Remboursements
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "info.main" }}>
                                        {PaymentService.formatCurrency(paymentStats.total_refunds || 0)}
                                    </Typography>
                                </Box>
                                <Undo color="info" />
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
                            placeholder="Rechercher par ID de paiement, email, événement..."
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
                                <MenuItem value="succeeded">Réussi</MenuItem>
                                <MenuItem value="pending">En attente</MenuItem>
                                <MenuItem value="failed">Échoué</MenuItem>
                                <MenuItem value="refunded">Remboursé</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            {filteredPayments.length} paiement(s) trouvé(s)
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

            {/* Payments Table */}
            {!loading && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID Paiement</TableCell>
                                <TableCell>Client</TableCell>
                                <TableCell>Événement</TableCell>
                                <TableCell>Montant</TableCell>
                                <TableCell>Méthode</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedPayments.map((payment) => (
                                <TableRow key={payment.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                            {payment.stripe_payment_id.substring(0, 20)}...
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                {payment.customer_name}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ fontSize: "0.75rem" }}>
                                                {payment.customer_email}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{payment.event_title}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                            {PaymentService.formatCurrency(payment.amount)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {PaymentService.getPaymentMethodLabel(payment.payment_method)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getStatusIcon(payment.status)}
                                            label={PaymentService.getPaymentStatusLabel(payment.status)}
                                            color={PaymentService.getPaymentStatusColor(payment.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{formatDate(payment.created_at)}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <Tooltip title="Voir détails">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedPayment(payment);
                                                        setDetailDialogOpen(true);
                                                    }}>
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            {payment.status === "succeeded" && (
                                                <Tooltip title="Rembourser">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedPayment(payment);
                                                            setRefundAmount((payment.amount / 100).toString());
                                                            setRefundDialogOpen(true);
                                                        }}>
                                                        <Undo />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={filteredPayments.length}
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

            {/* Payment Detail Dialog */}
            <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Détails du paiement: {selectedPayment?.stripe_payment_id}</DialogTitle>
                <DialogContent>
                    {selectedPayment && (
                        <Box sx={{ pt: 2 }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Informations client
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Nom
                                        </Typography>
                                        <Typography variant="body1">{selectedPayment.customer_name}</Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Email
                                        </Typography>
                                        <Typography variant="body1">{selectedPayment.customer_email}</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Détails du paiement
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Montant
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                            {PaymentService.formatCurrency(selectedPayment.amount)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Méthode de paiement
                                        </Typography>
                                        <Typography variant="body1">
                                            {PaymentService.getPaymentMethodLabel(selectedPayment.payment_method)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Statut
                                        </Typography>
                                        <Chip
                                            label={PaymentService.getPaymentStatusLabel(selectedPayment.status)}
                                            color={PaymentService.getPaymentStatusColor(selectedPayment.status)}
                                            size="small"
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* Refund Dialog */}
            <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Rembourser le paiement</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Montant à rembourser (€)"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            sx={{ mb: 2 }}
                            inputProps={{ min: 0, step: 0.01 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Raison du remboursement"
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="Expliquez la raison du remboursement..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRefundDialogOpen(false)}>Annuler</Button>
                    <Button
                        onClick={handleRefund}
                        variant="contained"
                        color="warning"
                        disabled={!refundAmount || !refundReason}>
                        Rembourser
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPayments;
