import { Container, Typography, Box, Grid, Card, CardContent, Avatar, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Business, Group, TrendingUp, Public } from '@mui/icons-material';

const AboutPage = () => {
    const theme = useTheme();
    const { t } = useTranslation('showroom');

    const values = [
        {
            icon: <Group sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t('about.values.community.title', 'Community First'),
            description: t('about.values.community.description', 'We believe in bringing people together and strengthening local communities through shared experiences.'),
        },
        {
            icon: <Public sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t('about.values.accessibility.title', 'Accessible to All'),
            description: t('about.values.accessibility.description', 'Everyone should have access to amazing events, regardless of their background or location.'),
        },
        {
            icon: <TrendingUp sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t('about.values.innovation.title', 'Innovation'),
            description: t('about.values.innovation.description', 'We continuously improve our platform to provide the best event discovery experience.'),
        },
        {
            icon: <Business sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t('about.values.support.title', 'Supporting Local'),
            description: t('about.values.support.description', 'We support local businesses and event organizers to thrive in their communities.'),
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            {/* Hero Section */}
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography 
                    variant="h2" 
                    component="h1" 
                    gutterBottom 
                    sx={{ color: theme.palette.primary.main }}
                >
                    {t('about.title', 'About Be Out')}
                </Typography>
                <Typography 
                    variant="h5" 
                    color="text.secondary" 
                    sx={{ maxWidth: 600, mx: 'auto' }}
                >
                    {t('about.subtitle', 'Connecting communities through amazing events')}
                </Typography>
            </Box>

            {/* Mission Section */}
            <Box sx={{ mb: 6 }}>
                <Typography 
                    variant="h4" 
                    component="h2" 
                    gutterBottom 
                    sx={{ mb: 3, color: theme.palette.primary.main }}
                >
                    {t('about.mission.title', 'Our Mission')}
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    {t('about.mission.description', 'Be Out was created with a simple yet powerful vision: to help people discover and connect through local events. We believe that every community has amazing experiences waiting to be discovered, and we\'re here to make that discovery effortless and enjoyable.')}
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    {t('about.mission.vision', 'Whether you\'re looking for live music, cultural events, sports activities, or culinary experiences, Be Out brings you closer to what matters most - your community and the experiences that enrich your life.')}
                </Typography>
            </Box>

            {/* Values Section */}
            <Box sx={{ mb: 6 }}>
                <Typography 
                    variant="h4" 
                    component="h2" 
                    textAlign="center" 
                    gutterBottom 
                    sx={{ mb: 4, color: theme.palette.primary.main }}
                >
                    {t('about.values.title', 'Our Values')}
                </Typography>
                <Grid container spacing={4}>
                    {values.map((value, index) => (
                        <Grid size={{ xs: 12, md: 6 }} key={index}>
                            <Card sx={{ height: '100%', p: 2 }}>
                                <CardContent>
                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                        <Avatar 
                                            sx={{ 
                                                bgcolor: 'transparent',
                                                width: 56,
                                                height: 56,
                                            }}
                                        >
                                            {value.icon}
                                        </Avatar>
                                        <Box>
                                            <Typography 
                                                variant="h6" 
                                                gutterBottom 
                                                sx={{ color: theme.palette.primary.main }}
                                            >
                                                {value.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {value.description}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Story Section */}
            <Box sx={{ mb: 6 }}>
                <Typography 
                    variant="h4" 
                    component="h2" 
                    gutterBottom 
                    sx={{ mb: 3, color: theme.palette.primary.main }}
                >
                    {t('about.story.title', 'Our Story')}
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    {t('about.story.beginning', 'Be Out was born from a simple observation: too many amazing local events go unnoticed, while people struggle to find activities that match their interests. We saw an opportunity to bridge this gap and create a platform that truly serves both event-goers and organizers.')}
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    {t('about.story.development', 'Built with modern technology and a user-first approach, Be Out combines the power of location-based discovery with the simplicity of social networking. Our platform is designed to be intuitive, accessible, and genuinely useful for discovering what\'s happening in your area.')}
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    {t('about.story.future', 'Today, Be Out continues to evolve, always with the goal of making event discovery more accessible, more social, and more aligned with what communities actually need.')}
                </Typography>
            </Box>

            {/* Contact CTA */}
            <Box 
                sx={{ 
                    textAlign: 'center', 
                    p: 4, 
                    bgcolor: theme.palette.grey[50], 
                    borderRadius: 2 
                }}
            >
                <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ color: theme.palette.primary.main }}
                >
                    {t('about.contact.title', 'Get in Touch')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {t('about.contact.description', 'Have questions about Be Out? Want to partner with us? We\'d love to hear from you.')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {t('about.contact.email', 'Email us at: ')}
                    <strong>contact@be-out.app</strong>
                </Typography>
            </Box>
        </Container>
    );
};

export default AboutPage;
