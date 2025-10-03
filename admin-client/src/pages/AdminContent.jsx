import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Alert,
    Pagination,
    InputAdornment,
    Tooltip,
    Fab,
    Tabs,
    Tab
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Language as LanguageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EmailEditor from '../components/EmailTemplateManager/components/EmailEditor';
import ContentImageUpload from '../components/ContentImageUpload';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const ContentManager = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPage, setSelectedPage] = useState(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        items_per_page: 20
    });
    const [filters, setFilters] = useState({
        category: '',
        published: '',
        search: '',
        language: 'fr'
    });
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

    const availableLanguages = [
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'es', name: 'Español', flag: '🇪🇸' }
    ];

    const categories = [
        { value: 'page', label: 'Page' },
        { value: 'blog', label: 'Blog' },
        { value: 'legal', label: 'Légal' }
    ];

    useEffect(() => {
        fetchPages();
    }, [pagination.current_page, filters]);

    const fetchPages = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.current_page.toString(),
                limit: pagination.items_per_page.toString(),
                language: filters.language,
                ...(filters.category && { category: filters.category }),
                ...(filters.published !== '' && { published: filters.published }),
                ...(filters.search && { search: filters.search })
            });

            const response = await fetch(`${API_BASE_URL}/content/pages?${params}`);
            const data = await response.json();

            if (data.success) {
                setPages(data.data.pages);
                setPagination(data.data.pagination);
            } else {
                showAlert('Erreur lors du chargement des pages', 'error');
            }
        } catch (error) {
            console.error('Error fetching pages:', error);
            showAlert('Erreur de connexion', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, severity = 'info') => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
    };

    const handleEdit = (page) => {
        setSelectedPage(page);
        setEditorOpen(true);
    };

    const handleAdd = () => {
        setSelectedPage(null);
        setEditorOpen(true);
    };

    const handleDeleteClick = (page) => {
        setPageToDelete(page);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!pageToDelete) return;

        try {
            const response = await fetch(`${API_BASE_URL}/content/pages/${pageToDelete.id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Page supprimée avec succès', 'success');
                fetchPages();
            } else {
                showAlert('Erreur lors de la suppression', 'error');
            }
        } catch (error) {
            console.error('Error deleting page:', error);
            showAlert('Erreur de connexion', 'error');
        } finally {
            setDeleteDialogOpen(false);
            setPageToDelete(null);
        }
    };

    const handlePageChange = (event, value) => {
        setPagination(prev => ({ ...prev, current_page: value }));
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'blog':
                return 'primary';
            case 'legal':
                return 'warning';
            case 'page':
                return 'default';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString) => {
        return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestion de Contenu
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    size="large"
                >
                    Créer une page
                </Button>
            </Box>

            {/* Alert */}
            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                            size="small"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                            select
                            fullWidth
                            label="Catégorie"
                            value={filters.category}
                            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            size="small"
                        >
                            <MenuItem value="">Toutes</MenuItem>
                            {categories.map((cat) => (
                                <MenuItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                            select
                            fullWidth
                            label="Statut"
                            value={filters.published}
                            onChange={(e) => setFilters(prev => ({ ...prev, published: e.target.value }))}
                            size="small"
                        >
                            <MenuItem value="">Tous</MenuItem>
                            <MenuItem value="true">Publié</MenuItem>
                            <MenuItem value="false">Brouillon</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                            select
                            fullWidth
                            label="Langue"
                            value={filters.language}
                            onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                            size="small"
                        >
                            {availableLanguages.map((lang) => (
                                <MenuItem key={lang.code} value={lang.code}>
                                    {lang.flag} {lang.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>
            </Paper>

            {/* Content Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Titre</TableCell>
                            <TableCell>Slug</TableCell>
                            <TableCell>Catégorie</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Vues</TableCell>
                            <TableCell>Créé le</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    Chargement...
                                </TableCell>
                            </TableRow>
                        ) : pages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    Aucune page trouvée
                                </TableCell>
                            </TableRow>
                        ) : (
                            pages.map((page) => (
                                <TableRow key={page.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {page.title || 'Sans titre'}
                                            {page.language && (
                                                <Chip
                                                    size="small"
                                                    label={page.language.toUpperCase()}
                                                    variant="outlined"
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            {page.slug}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={page.category}
                                            color={getCategoryColor(page.category)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={page.published ? 'Publié' : 'Brouillon'}
                                            color={page.published ? 'success' : 'default'}
                                            variant={page.published ? 'filled' : 'outlined'}
                                        />
                                    </TableCell>
                                    <TableCell>{page.view_count || 0}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDate(page.created_at)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="Modifier">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEdit(page)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Supprimer">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteClick(page)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={pagination.total_pages}
                        page={pagination.current_page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                    />
                </Box>
            )}

            {/* Content Editor Dialog */}
            <ContentEditor
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                page={selectedPage}
                onSave={fetchPages}
                onAlert={showAlert}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer la page "{pageToDelete?.title || pageToDelete?.slug}" ?
                        Cette action est irréversible.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// Content Editor Component
const ContentEditor = ({ open, onClose, page, onSave, onAlert }) => {
    const [formData, setFormData] = useState({
        slug: '',
        category: 'page',
        featured_image: '',
        keywords: [],
        published: false,
        translations: [
            { language: 'fr', title: '', content: '', meta_description: '', excerpt: '' }
        ]
    });
    const [keywordsInput, setKeywordsInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(0); // For language tabs

    const availableLanguages = [
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'es', name: 'Español', flag: '🇪🇸' }
    ];

    const categories = [
        { value: 'page', label: 'Page' },
        { value: 'blog', label: 'Blog' },
        { value: 'legal', label: 'Légal' }
    ];

    useEffect(() => {
        if (page) {
            // Load existing page for editing
            fetchPageDetails();
        } else {
            // Reset form for new page
            setFormData({
                slug: '',
                category: 'page',
                featured_image: '',
                keywords: [],
                published: false,
                translations: [
                    { language: 'fr', title: '', content: '', meta_description: '', excerpt: '' }
                ]
            });
            setKeywordsInput('');
        }
        // Always reset to French tab when opening dialog
        setActiveTab(0);
    }, [page, open]);

    const fetchPageDetails = async () => {
        if (!page) return;

        try {
            const response = await fetch(`${API_BASE_URL}/content/pages/${page.slug}`);
            const data = await response.json();

            if (data.success) {
                const pageData = data.data;
                setFormData({
                    slug: pageData.slug,
                    category: pageData.category,
                    featured_image: pageData.featured_image || '',
                    keywords: pageData.keywords || [],
                    published: pageData.published,
                    translations: pageData.translations.length > 0 ? pageData.translations : [
                        { language: 'fr', title: '', content: '', meta_description: '', excerpt: '' }
                    ]
                });
                setKeywordsInput((pageData.keywords || []).join(', '));
            }
        } catch (error) {
            console.error('Error fetching page details:', error);
            onAlert('Erreur lors du chargement des détails', 'error');
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Validate required fields
            if (!formData.slug.trim()) {
                onAlert('Le slug est requis', 'error');
                return;
            }

            if (formData.translations.some(t => !t.title.trim() || !t.content.trim())) {
                onAlert('Le titre et le contenu sont requis pour toutes les langues', 'error');
                return;
            }

            // Prepare data
            const saveData = {
                ...formData,
                keywords: keywordsInput.split(',').map(k => k.trim()).filter(k => k),
                translations: formData.translations.filter(t => t.title.trim() && t.content.trim())
            };

            const url = page
                ? `${API_BASE_URL}/content/pages/${page.id}`
                : `${API_BASE_URL}/content/pages`;

            const method = page ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saveData)
            });

            const data = await response.json();

            if (data.success) {
                onAlert(page ? 'Page mise à jour avec succès' : 'Page créée avec succès', 'success');
                onSave();
                onClose();
            } else {
                onAlert(data.message || 'Erreur lors de la sauvegarde', 'error');
            }

        } catch (error) {
            console.error('Error saving page:', error);
            onAlert('Erreur de connexion', 'error');
        } finally {
            setSaving(false);
        }
    };

    const addTranslation = () => {
        const existingLanguages = formData.translations.map(t => t.language);
        const availableLanguage = availableLanguages.find(lang => !existingLanguages.includes(lang.code));

        if (availableLanguage) {
            setFormData(prev => ({
                ...prev,
                translations: [
                    ...prev.translations,
                    { language: availableLanguage.code, title: '', content: '', meta_description: '', excerpt: '' }
                ]
            }));
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Ensure French is always first in the translations array
    const sortedTranslations = [...formData.translations].sort((a, b) => {
        if (a.language === 'fr') return -1;
        if (b.language === 'fr') return 1;
        return 0;
    });

    const removeTranslation = (index) => {
        if (formData.translations.length > 1) {
            setFormData(prev => ({
                ...prev,
                translations: prev.translations.filter((_, i) => i !== index)
            }));
        }
    };

    const updateTranslation = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            translations: prev.translations.map((translation, i) =>
                i === index ? { ...translation, [field]: value } : translation
            )
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                {page ? 'Modifier la page' : 'Créer une nouvelle page'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Grid container spacing={3}>
                        {/* Basic Information */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Slug (URL)"
                                value={formData.slug}
                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                helperText="Utilisé dans l'URL (ex: mon-article)"
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                select
                                fullWidth
                                label="Catégorie"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <ContentImageUpload
                                currentImage={formData.featured_image || ''}
                                onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, featured_image: imageUrl }))}
                                height={200}
                                label="Image mise en avant"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TextField
                                    label="Publié"
                                    select
                                    value={formData.published ? 'true' : 'false'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.value === 'true' }))}
                                >
                                    <MenuItem value="false">Brouillon</MenuItem>
                                    <MenuItem value="true">Publié</MenuItem>
                                </TextField>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Mots-clés (séparés par des virgules)"
                                value={keywordsInput}
                                onChange={(e) => setKeywordsInput(e.target.value)}
                                placeholder="blog, actualité, be-out"
                                helperText="Utilisés pour le SEO et la recherche"
                            />
                        </Grid>

                        {/* Translations with Tabs */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Traductions
                                </Typography>
                                {formData.translations.length < availableLanguages.length && (
                                    <Button
                                        startIcon={<LanguageIcon />}
                                        onClick={addTranslation}
                                        size="small"
                                    >
                                        Ajouter une langue
                                    </Button>
                                )}
                            </Box>

                            <Paper sx={{ width: '100%' }}>
                                {/* Language Tabs */}
                                <Tabs
                                    value={activeTab}
                                    onChange={handleTabChange}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                                >
                                    {sortedTranslations.map((translation, index) => {
                                        const language = availableLanguages.find(l => l.code === translation.language);
                                        return (
                                            <Tab
                                                key={translation.language}
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <span>{language?.flag}</span>
                                                        <span>{language?.name}</span>
                                                        {formData.translations.length > 1 && translation.language !== 'fr' && (
                                                            <Box
                                                                component="span"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const originalIndex = formData.translations.findIndex(t => t.language === translation.language);
                                                                    removeTranslation(originalIndex);
                                                                    if (activeTab >= index && activeTab > 0) {
                                                                        setActiveTab(activeTab - 1);
                                                                    }
                                                                }}
                                                                sx={{
                                                                    ml: 1,
                                                                    p: 0.5,
                                                                    cursor: 'pointer',
                                                                    borderRadius: '50%',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'error.main',
                                                                    '&:hover': {
                                                                        backgroundColor: 'error.light',
                                                                        color: 'error.dark'
                                                                    }
                                                                }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </Box>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        );
                                    })}
                                </Tabs>

                                {/* Tab Content */}
                                {sortedTranslations.map((translation, tabIndex) => {
                                    const originalIndex = formData.translations.findIndex(t => t.language === translation.language);
                                    return (
                                        <Box
                                            key={translation.language}
                                            role="tabpanel"
                                            hidden={activeTab !== tabIndex}
                                            sx={{ p: 3 }}
                                        >
                                            {activeTab === tabIndex && (
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Titre"
                                                            value={translation.title || ''}
                                                            onChange={(e) => updateTranslation(originalIndex, 'title', e.target.value)}
                                                            required
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Description méta (SEO)"
                                                            value={translation.meta_description || ''}
                                                            onChange={(e) => updateTranslation(originalIndex, 'meta_description', e.target.value)}
                                                            multiline
                                                            rows={2}
                                                            helperText="Résumé pour les moteurs de recherche"
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Extrait (pour les listes)"
                                                            value={translation.excerpt || ''}
                                                            onChange={(e) => updateTranslation(originalIndex, 'excerpt', e.target.value)}
                                                            multiline
                                                            rows={2}
                                                            helperText="Aperçu affiché dans les listes de blog"
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12 }}>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Contenu
                                                        </Typography>
                                                        <EmailEditor
                                                            value={translation.content || ''}
                                                            onChange={(value) => updateTranslation(originalIndex, 'content', value)}
                                                            height="400px"
                                                            showWysiwyg={true}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    Annuler
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={saving}
                >
                    {saving ? 'Sauvegarde...' : (page ? 'Mettre à jour' : 'Créer')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ContentManager;
