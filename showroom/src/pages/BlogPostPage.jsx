import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Chip,
    Skeleton,
    Alert,
    Button,
    IconButton,
    Breadcrumbs,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    CalendarToday as CalendarIcon,
    Visibility as ViewIcon,
    Share as ShareIcon,
    Facebook as FacebookIcon,
    Twitter as TwitterIcon,
    LinkedIn as LinkedInIcon
} from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { enUS as en } from 'date-fns/locale';
import { es } from 'date-fns/locale';
import contentService from '../services/contentService';

const BlogPostPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('showroom');
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recentPosts, setRecentPosts] = useState([]);

    const dateLocales = {
        fr: fr,
        en: en,
        es: es
    };

    useEffect(() => {
        fetchPost();
        fetchRecentPosts();
    }, [slug, i18n.language]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            setError(null);

            const postData = await contentService.getPageBySlug(slug, i18n.language);
            setPost(postData);

            // Update page title and meta
            document.title = `${postData.title} - Be Out Blog`;
            if (postData.meta_description) {
                const metaDescription = document.querySelector('meta[name="description"]');
                if (metaDescription) {
                    metaDescription.setAttribute('content', postData.meta_description);
                }
            }
        } catch (err) {
            console.error('Error fetching blog post:', err);
            setError('Article non trouvé');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentPosts = async () => {
        try {
            const posts = await contentService.getRecentBlogPosts(i18n.language, 3);
            setRecentPosts(posts.filter(p => p.slug !== slug)); // Exclude current post
        } catch (err) {
            console.error('Error fetching recent posts:', err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const locale = dateLocales[i18n.language] || dateLocales.fr;
        return format(date, 'dd MMMM yyyy', { locale });
    };

    const handleShare = (platform) => {
        const url = window.location.href;
        const title = post?.title || '';
        let shareUrl = '';

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                // Could add a toast notification here
                return;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    };

    const stripHtml = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="text" width="100%" height={48} sx={{ mt: 2 }} />
                    <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2 }} />
                </Box>
                <Paper sx={{ p: 4 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="100%" height={20} />
                    <Skeleton variant="text" width="80%" height={20} />
                </Paper>
            </Container>
        );
    }

    if (error || !post) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error || 'Article non trouvé'}
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/blog')}
                    variant="outlined"
                >
                    {t('blog.backToBlog', 'Retour au blog')}
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 3 }} separator="›">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {t('nav.home', 'Accueil')}
                </Link>
                <Link to="/blog" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {t('blog.title', 'Blog')}
                </Link>
                <Typography color="primary">{post.title}</Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
                {/* Main Content */}
                <Box>
                    {/* Article Header */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h3" component="h1" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
                            {post.title}
                        </Typography>

                        {/* Meta Information */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', color: 'text.secondary', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon fontSize="small" />
                                <Typography variant="body2">
                                    {formatDate(post.created_at)}
                                </Typography>
                            </Box>
                            {post.view_count > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <ViewIcon fontSize="small" />
                                    <Typography variant="body2">
                                        {post.view_count} {t('blog.views', 'vues')}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Keywords */}
                        {post.keywords && post.keywords.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                                {post.keywords.map((keyword, index) => (
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

                        {/* Featured Image */}
                        {post.featured_image && (
                            <Box
                                component="img"
                                src={post.featured_image}
                                alt={post.title}
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: 400,
                                    objectFit: 'cover',
                                    borderRadius: 2,
                                    mb: 4
                                }}
                            />
                        )}
                    </Box>

                    {/* Article Content */}
                    <Paper elevation={0} sx={{ p: 4, mb: 4 }}>
                        <Box
                            sx={{
                                '& h1, & h2, & h3, & h4, & h5, & h6': {
                                    color: 'primary.main',
                                    fontWeight: 600,
                                    mt: 3,
                                    mb: 2
                                },
                                '& p': {
                                    mb: 2,
                                    lineHeight: 1.7
                                },
                                '& ul, & ol': {
                                    mb: 2,
                                    pl: 3
                                },
                                '& li': {
                                    mb: 1
                                },
                                '& blockquote': {
                                    borderLeft: '4px solid',
                                    borderColor: 'primary.main',
                                    pl: 2,
                                    ml: 0,
                                    fontStyle: 'italic',
                                    color: 'text.secondary'
                                },
                                '& img': {
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: 1
                                },
                                '& a': {
                                    color: 'primary.main',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline'
                                    }
                                }
                            }}
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </Paper>

                    {/* Share Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('blog.share', 'Partager :')}
                        </Typography>
                        <IconButton
                            onClick={() => handleShare('facebook')}
                            sx={{ color: '#1877F2' }}
                        >
                            <FacebookIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => handleShare('twitter')}
                            sx={{ color: '#1DA1F2' }}
                        >
                            <TwitterIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => handleShare('linkedin')}
                            sx={{ color: '#0A66C2' }}
                        >
                            <LinkedInIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => handleShare('copy')}
                            sx={{ color: 'text.secondary' }}
                        >
                            <ShareIcon />
                        </IconButton>
                    </Box>

                    {/* Back Button */}
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/blog')}
                        variant="outlined"
                        size="large"
                    >
                        {t('blog.backToBlog', 'Retour au blog')}
                    </Button>
                </Box>

                {/* Sidebar */}
                <Box>
                    {/* Recent Posts */}
                    {recentPosts.length > 0 && (
                        <Card sx={{ mb: 4 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    {t('blog.recentPosts', 'Articles récents')}
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                {recentPosts.map((recentPost, index) => (
                                    <Box key={recentPost.id}>
                                        <Box
                                            component={Link}
                                            to={`/blog/${recentPost.slug}`}
                                            sx={{
                                                display: 'block',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                '&:hover': {
                                                    '& .post-title': {
                                                        color: 'primary.main'
                                                    }
                                                }
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                className="post-title"
                                                sx={{ fontWeight: 600, mb: 0.5, transition: 'color 0.2s' }}
                                            >
                                                {recentPost.title}
                                            </Typography>
                                            {recentPost.excerpt && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {stripHtml(recentPost.excerpt).substring(0, 80)}...
                                                </Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(recentPost.created_at)}
                                            </Typography>
                                        </Box>
                                        {index < recentPosts.length - 1 && <Divider sx={{ my: 2 }} />}
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Call to Action */}
                    <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                                {t('blog.cta.title', 'Découvrez Be Out')}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                                {t('blog.cta.description', 'Trouvez vos prochains événements à prix réduits')}
                            </Typography>
                            <Button
                                variant="contained"
                                href="https://frontend.be-out-app.dedibox2.philippezenone.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    backgroundColor: 'background.paper',
                                    color: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: 'background.default'
                                    }
                                }}
                            >
                                {t('nav.openApp', 'Ouvrir l\'app')}
                            </Button>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Container>
    );
};

export default BlogPostPage;
