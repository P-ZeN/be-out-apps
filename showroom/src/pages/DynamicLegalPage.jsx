import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Divider, Paper, Skeleton, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import contentService from '../services/contentService';

const DynamicLegalPage = ({ slug: propSlug }) => {
    const { slug: paramSlug } = useParams();
    const slug = propSlug || paramSlug;
    const { t, i18n } = useTranslation('showroom');
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPage();
    }, [slug, i18n.language]);

    const fetchPage = async () => {
        try {
            setLoading(true);
            setError(null);

            const pageData = await contentService.getPageBySlug(slug, i18n.language);
            setPage(pageData);

            // Update page title and meta
            document.title = `${pageData.title} - Be Out`;
            if (pageData.meta_description) {
                const metaDescription = document.querySelector('meta[name="description"]');
                if (metaDescription) {
                    metaDescription.setAttribute('content', pageData.meta_description);
                }
            }
        } catch (err) {
            console.error('Error fetching legal page:', err);
            setError('Page non trouvée');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Paper elevation={0} sx={{ p: 4 }}>
                    <Skeleton variant="text" width="80%" height={48} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" width="100%" height={2} sx={{ mb: 3 }} />
                    <Skeleton variant="text" width="100%" height={20} />
                    <Skeleton variant="text" width="100%" height={20} />
                    <Skeleton variant="text" width="90%" height={20} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mt: 2 }} />
                    <Skeleton variant="text" width="95%" height={20} />
                </Paper>
            </Container>
        );
    }

    if (error || !page) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">
                    {error || 'Page non trouvée'}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
                    {page.title}
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Box
                    sx={{
                        '& > *': { mb: 3 },
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                            color: 'primary.main',
                            fontWeight: 600,
                            mt: 3,
                            mb: 2
                        },
                        '& p': {
                            mb: 2,
                            lineHeight: 1.7,
                            textAlign: 'justify'
                        },
                        '& ul, & ol': {
                            mb: 2,
                            pl: 3
                        },
                        '& li': {
                            mb: 1
                        },
                        '& strong': {
                            fontWeight: 600
                        },
                        '& blockquote': {
                            borderLeft: '4px solid',
                            borderColor: 'primary.main',
                            pl: 2,
                            ml: 0,
                            fontStyle: 'italic',
                            color: 'text.secondary'
                        },
                        '& a': {
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        }
                    }}
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            </Paper>
        </Container>
    );
};

export default DynamicLegalPage;
