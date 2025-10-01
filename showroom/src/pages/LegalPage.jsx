import { Container, Typography, Box, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const LegalPage = () => {
    const theme = useTheme();
    const { t } = useTranslation('showroom');

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{ color: theme.palette.primary.main, mb: 4 }}
            >
                {t('legal.title', 'Terms of Service')}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {t('legal.lastUpdated', 'Last updated: October 1, 2025')}
            </Typography>

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('legal.acceptance.title', '1. Acceptance of Terms')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.acceptance.content', 'By accessing and using Be Out, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('legal.service.title', '2. Use of Service')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.service.description', 'Be Out is a platform that helps users discover local events and connect with their community. The service is provided "as is" and we reserve the right to modify or discontinue the service at any time.')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.service.userAccount', 'Users are responsible for maintaining the confidentiality of their account and password and for restricting access to their account.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('legal.conduct.title', '3. User Conduct')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.conduct.content', 'Users agree not to use the service to:')}
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <Typography component="li" variant="body1" paragraph>
                        {t('legal.conduct.harassment', 'Harass, abuse, or harm other users')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('legal.conduct.illegal', 'Violate any applicable laws or regulations')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('legal.conduct.spam', 'Spam or send unsolicited communications')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('legal.conduct.false', 'Post false or misleading information')}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('legal.content.title', '4. Content and Intellectual Property')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.content.ownership', 'Users retain ownership of content they post on Be Out. By posting content, users grant Be Out a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content on the platform.')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.content.platform', 'Be Out retains all rights to the platform\'s design, functionality, and underlying technology.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('legal.privacy.title', '5. Privacy')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.privacy.content', 'Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('legal.limitation.title', '6. Limitation of Liability')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.limitation.content', 'Be Out shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('legal.termination.title', '7. Termination')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.termination.content', 'We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('legal.changes.title', '8. Changes to Terms')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.changes.content', 'We reserve the right to modify these terms at any time. We will always post the most current version of our terms on this page.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('legal.contact.title', '9. Contact Information')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('legal.contact.content', 'If you have any questions about these Terms of Service, please contact us at:')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    contact@be-out.app
                </Typography>
            </Box>
        </Container>
    );
};

export default LegalPage;
