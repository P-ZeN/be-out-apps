import React, { useState } from "react";
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
    TextField,
    Chip,
    InputAdornment,
    Tooltip,
    MenuItem,
} from "@mui/material";
import { Add, Edit, Delete, Send, Search, Refresh } from "@mui/icons-material";
import { availableLanguages } from "../constants";

const TemplatesTab = ({
    templates,
    searchTerm,
    setSearchTerm,
    selectedLanguage,
    setSelectedLanguage,
    onRefresh,
    onAddTemplate,
    onEditTemplate,
    onDeleteTemplate,
    onTestTemplate,
}) => {
    const filteredTemplates = templates.filter(
        (template) =>
            template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) {
            onDeleteTemplate(id);
        }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <TextField
                        placeholder="Rechercher des templates..."
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
                        label="Langue"
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
                    <Button variant="outlined" onClick={onRefresh} startIcon={<Refresh />} sx={{ mr: 1 }}>
                        Actualiser
                    </Button>
                    <Button variant="contained" onClick={onAddTemplate} startIcon={<Add />}>
                        Ajouter Template
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom</TableCell>
                            <TableCell>Langue</TableCell>
                            <TableCell>Sujet</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Créé</TableCell>
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
                                        label={template.is_active ? "Actif" : "Inactif"}
                                        color={template.is_active ? "success" : "default"}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Tooltip title="Modifier">
                                        <IconButton onClick={() => onEditTemplate(template)}>
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Tester Email">
                                        <IconButton onClick={() => onTestTemplate(template)}>
                                            <Send />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                        <IconButton onClick={() => handleDelete(template.id)}>
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
    );
};

export default TemplatesTab;
