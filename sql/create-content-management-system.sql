-- Content Management System Tables
-- This creates a flexible blog/page system for Be-Out apps

-- Main content pages table
CREATE TABLE content_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) DEFAULT 'page' CHECK (category IN ('page', 'blog', 'legal')),
    featured_image TEXT,
    keywords TEXT[],
    published BOOLEAN DEFAULT false,
    author_id UUID, -- Optional: link to users table if needed
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content translations for i18n support
CREATE TABLE content_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES content_pages(id) ON DELETE CASCADE,
    language VARCHAR(5) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    excerpt TEXT, -- For blog post previews
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(page_id, language)
);

-- Indexes for performance
CREATE INDEX idx_content_pages_category ON content_pages(category);
CREATE INDEX idx_content_pages_published ON content_pages(published);
CREATE INDEX idx_content_pages_created_at ON content_pages(created_at DESC);
CREATE INDEX idx_content_translations_page_id ON content_translations(page_id);
CREATE INDEX idx_content_translations_language ON content_translations(language);
CREATE INDEX idx_content_pages_slug ON content_pages(slug);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_pages_updated_at
    BEFORE UPDATE ON content_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER trigger_content_translations_updated_at
    BEFORE UPDATE ON content_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

-- Insert existing legal pages as migration data
INSERT INTO content_pages (slug, category, published, keywords, created_at) VALUES
('conditions-generales-utilisation', 'legal', true, ARRAY['cgu', 'legal', 'terms'], NOW()),
('conditions-generales-vente', 'legal', true, ARRAY['cgv', 'legal', 'sales'], NOW()),
('mentions-legales', 'legal', true, ARRAY['legal', 'mentions'], NOW()),
('politique-confidentialite', 'legal', true, ARRAY['privacy', 'rgpd', 'data', 'confidentialité'], NOW());

-- Insert French translations for existing legal pages (placeholders)
INSERT INTO content_translations (page_id, language, title, content, meta_description)
SELECT
    cp.id,
    'fr',
    CASE
        WHEN cp.slug = 'conditions-generales-utilisation' THEN 'Conditions Générales d''Utilisation'
        WHEN cp.slug = 'conditions-generales-vente' THEN 'Conditions Générales de Vente'
        WHEN cp.slug = 'mentions-legales' THEN 'Mentions Légales'
        WHEN cp.slug = 'politique-confidentialite' THEN 'Politique de Confidentialité'
    END,
    '<p>Contenu à migrer depuis les pages existantes</p>',
    CASE
        WHEN cp.slug = 'conditions-generales-utilisation' THEN 'Conditions d''utilisation de l''application Be Out'
        WHEN cp.slug = 'conditions-generales-vente' THEN 'Conditions de vente pour les billets Be Out'
        WHEN cp.slug = 'mentions-legales' THEN 'Informations légales de Be Out'
        WHEN cp.slug = 'politique-confidentialite' THEN 'Politique de protection des données personnelles'
    END
FROM content_pages cp
WHERE cp.category = 'legal';

-- Add English placeholder translations
INSERT INTO content_translations (page_id, language, title, content, meta_description)
SELECT
    cp.id,
    'en',
    CASE
        WHEN cp.slug = 'conditions-generales-utilisation' THEN 'Terms of Use'
        WHEN cp.slug = 'conditions-generales-vente' THEN 'Terms of Sale'
        WHEN cp.slug = 'mentions-legales' THEN 'Legal Notice'
        WHEN cp.slug = 'politique-confidentialite' THEN 'Privacy Policy'
    END,
    '<p>Content to be migrated from existing pages</p>',
    CASE
        WHEN cp.slug = 'conditions-generales-utilisation' THEN 'Terms of use for Be Out application'
        WHEN cp.slug = 'conditions-generales-vente' THEN 'Sales terms for Be Out tickets'
        WHEN cp.slug = 'mentions-legales' THEN 'Legal information for Be Out'
        WHEN cp.slug = 'politique-confidentialite' THEN 'Personal data protection policy'
    END
FROM content_pages cp
WHERE cp.category = 'legal';

-- Add Spanish placeholder translations
INSERT INTO content_translations (page_id, language, title, content, meta_description)
SELECT
    cp.id,
    'es',
    CASE
        WHEN cp.slug = 'conditions-generales-utilisation' THEN 'Términos de Uso'
        WHEN cp.slug = 'conditions-generales-vente' THEN 'Términos de Venta'
        WHEN cp.slug = 'mentions-legales' THEN 'Aviso Legal'
        WHEN cp.slug = 'politique-confidentialite' THEN 'Política de Privacidad'
    END,
    '<p>Contenido a migrar desde las páginas existentes</p>',
    CASE
        WHEN cp.slug = 'conditions-generales-utilisation' THEN 'Términos de uso de la aplicación Be Out'
        WHEN cp.slug = 'conditions-generales-vente' THEN 'Términos de venta para tickets Be Out'
        WHEN cp.slug = 'mentions-legales' THEN 'Información legal de Be Out'
        WHEN cp.slug = 'politique-confidentialite' THEN 'Política de protección de datos personales'
    END
FROM content_pages cp
WHERE cp.category = 'legal';

COMMIT;
