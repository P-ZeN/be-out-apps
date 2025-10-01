import { Container, Typography, Box, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const PrivacyPage = () => {
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
                {t('privacy.title', 'Privacy Policy')}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {t('privacy.lastUpdated', 'Last updated: October 1, 2025')}
            </Typography>

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('privacy.intro.title', '1. Introduction')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.intro.content', 'Be Out ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web service.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('privacy.collection.title', '2. Information We Collect')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.collection.personal', 'Personal Information: When you create an account, we may collect:')}
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.collection.name', 'Name and email address')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.collection.profile', 'Profile information you choose to provide')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.collection.preferences', 'Event preferences and interests')}
                    </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                    {t('privacy.collection.location', 'Location Information: We may collect location data to help you discover events near you. You can control location sharing through your device settings.')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.collection.usage', 'Usage Information: We collect information about how you interact with our service, including events viewed, searches performed, and features used.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('privacy.use.title', '3. How We Use Your Information')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.use.content', 'We use your information to:')}
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.use.service', 'Provide and maintain our service')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.use.personalize', 'Personalize your experience and event recommendations')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.use.communicate', 'Communicate with you about events and updates')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.use.improve', 'Improve our service and develop new features')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.use.security', 'Ensure security and prevent fraud')}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('privacy.sharing.title', '4. Information Sharing')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.sharing.content', 'We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:')}
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.sharing.consent', 'With your explicit consent')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.sharing.service', 'With service providers who help us operate our platform')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.sharing.legal', 'When required by law or to protect our rights')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.sharing.business', 'In connection with a business transaction')}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('privacy.security.title', '5. Security')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.security.content', 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('privacy.rights.title', '6. Your Rights')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.rights.content', 'You have the right to:')}
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.rights.access', 'Access and update your personal information')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.rights.delete', 'Request deletion of your account and data')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.rights.opt', 'Opt out of certain communications')}
                    </Typography>
                    <Typography component="li" variant="body1" paragraph>
                        {t('privacy.rights.portable', 'Request data portability (where applicable)')}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('privacy.cookies.title', '7. Cookies and Tracking')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.cookies.content', 'We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie settings through your browser.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('privacy.children.title', '8. Children\'s Privacy')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.children.content', 'Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('privacy.changes.title', '9. Changes to This Policy')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.changes.content', 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.')}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    {t('privacy.contact.title', '10. Contact Us')}
                </Typography>
                <Typography variant="body1" paragraph>
                    {t('privacy.contact.content', 'If you have any questions about this Privacy Policy, please contact us at:')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    contact@be-out.app
                </Typography>
            </Box>
        </Container>
    );
};

export default PrivacyPage;
