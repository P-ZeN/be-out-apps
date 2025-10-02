import React from "react";
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
    Chip,
} from "@mui/material";

const getStatusColor = (status) => {
    switch (status) {
        case "sent":
        case "delivered":
            return "success";
        case "failed":
        case "error":
            return "error";
        case "pending":
            return "warning";
        default:
            return "default";
    }
};

const EmailLogsTab = ({ logs }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Activité Email Récente
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Destinataire</TableCell>
                            <TableCell>Template</TableCell>
                            <TableCell>Sujet</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Envoyé</TableCell>
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
    );
};

export default EmailLogsTab;
