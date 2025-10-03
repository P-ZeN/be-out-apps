import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    CardMedia,
    Grid,
    Chip,
    Pagination,
    TextField,
    InputAdornment,
    Skeleton,
    Alert,
    Button
} from '@mui/material';
import { Search as SearchIcon, CalendarToday as CalendarIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { enUS as en } from 'date-fns/locale';
import { es } from 'date-fns/locale';
import contentService from '../services/contentService';

const BlogPage = () => {
    const { t, i18n } = useTranslation('showroom');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        items_per_page: 9
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const dateLocales = {
        fr: fr,
        en: en,
        es: es
    };

    useEffect(() => {
        fetchPosts();
    }, [pagination.current_page, searchTerm, i18n.language]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await contentService.getBlogPosts({
                language: i18n.language,
                page: pagination.current_page,
                limit: pagination.items_per_page,
                search: searchTerm || null
            });

            setPosts(result.pages);
            setPagination(result.pagination);
        } catch (err) {
            console.error('Error fetching blog posts:', err);
            setError('Erreur lors du chargement des articles');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (event, value) => {
        setPagination(prev => ({ ...prev, current_page: value }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearch = () => {
        setSearchTerm(searchInput);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSearchKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const locale = dateLocales[i18n.language] || dateLocales.fr;
        return format(date, 'dd MMMM yyyy', { locale });
    };

    const stripHtml = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const truncateText = (text, maxLength = 150) => {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h2" component="h1" gutterBottom color="primary">
                    {t('blog.title', 'Blog Be Out')}
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
                    {t('blog.subtitle', 'Actualités, conseils et coulisses de Be Out')}
                </Typography>

                {/* Search */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, maxWidth: 500, mx: 'auto' }}>
                    <TextField
                        fullWidth
                        placeholder={t('blog.searchPlaceholder', 'Rechercher un article...')}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                        size="medium"
                    />
                    <Button
                        variant="contained"
                        onClick={handleSearch}
                        sx={{ minWidth: 100 }}
                    >
                        {t('blog.search', 'Rechercher')}
                    </Button>
                </Box>
            </Box>

            {/* Error State */}
            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error}
                </Alert>
            )}

            {/* Loading State */}
            {loading ? (
                <Grid container spacing={4}>
                    {[...Array(6)].map((_, index) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                            <Card>
                                <Skeleton variant="rectangular" height={200} />
                                <CardContent>
                                    <Skeleton variant="text" height={32} />
                                    <Skeleton variant="text" height={20} />
                                    <Skeleton variant="text" height={20} />
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                        <Skeleton variant="rectangular" width={60} height={24} />
                                        <Skeleton variant="rectangular" width={80} height={24} />
                                    </Box>
                                </CardContent>
                            </Card>
                                        </Grid>
                    ))}
                </Grid>
            ) : posts.length === 0 ? (
                /* Empty State */
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        {searchTerm
                            ? t('blog.noResultsSearch', 'Aucun article trouvé pour votre recherche')
                            : t('blog.noArticles', 'Aucun article publié pour le moment')
                        }
                    </Typography>
                    {searchTerm && (
                        <Button
                            onClick={() => {
                                setSearchTerm('');
                                setSearchInput('');
                            }}
                            sx={{ mt: 2 }}
                        >
                            {t('blog.clearSearch', 'Voir tous les articles')}
                        </Button>
                    )}
                </Box>
            ) : (
                /* Blog Posts Grid */
                <>
                    <Grid container spacing={4}>
                        {posts.map((post) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={post.id}>
                                <Card
                                    component={Link}
                                    to={`/blog/${post.slug}`}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: (theme) => theme.shadows[8]
                                        }
                                    }}
                                >
                                    {post.featured_image && (
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={post.featured_image}
                                            alt={post.title}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                    )}
                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                                            {post.title}
                                        </Typography>

                                        {post.excerpt && (
                                            <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
                                                {truncateText(stripHtml(post.excerpt), 120)}
                                            </Typography>
                                        )}

                                        <Box sx={{ mt: 'auto' }}>
                                            {/* Keywords */}
                                            {post.keywords && post.keywords.length > 0 && (
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                                    {post.keywords.slice(0, 3).map((keyword, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={keyword}
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                        />
                                                    ))}
                                                </Box>
                                            )}

                                            {/* Meta information */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                                    <CalendarIcon fontSize="small" />
                                                    <Typography variant="caption">
                                                        {formatDate(post.created_at)}
                                                    </Typography>
                                                </Box>
                                                {post.view_count > 0 && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                                        <ViewIcon fontSize="small" />
                                                        <Typography variant="caption">
                                                            {post.view_count}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Pagination */}
                    {pagination.total_pages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                            <Pagination
                                count={pagination.total_pages}
                                page={pagination.current_page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
};

export default BlogPage;
