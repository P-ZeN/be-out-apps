const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Content API service for the showroom app
 * Fetches blog posts and other content from the backend
 */
class ContentService {
    /**
     * Fetch published pages with pagination and filtering
     */
    async getPages({ category = null, language = 'fr', page = 1, limit = 10, search = null } = {}) {
        try {
            const params = new URLSearchParams({
                published: 'true',
                page: page.toString(),
                limit: limit.toString(),
                language
            });

            if (category) params.append('category', category);
            if (search) params.append('search', search);

            const response = await fetch(`${API_BASE_URL}/content/pages?${params}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch pages');
            }

            return data.data;
        } catch (error) {
            console.error('Error fetching pages:', error);
            throw error;
        }
    }

    /**
     * Fetch a single page by slug
     */
    async getPageBySlug(slug, language = 'fr') {
        try {
            const params = new URLSearchParams({ lang: language });
            const response = await fetch(`${API_BASE_URL}/content/public/${slug}?${params}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Page not found');
            }

            return data.data;
        } catch (error) {
            console.error('Error fetching page:', error);
            throw error;
        }
    }

    /**
     * Get blog posts specifically
     */
    async getBlogPosts({ language = 'fr', page = 1, limit = 10, search = null } = {}) {
        return this.getPages({
            category: 'blog',
            language,
            page,
            limit,
            search
        });
    }

    /**
     * Get legal pages specifically
     */
    async getLegalPages(language = 'fr') {
        return this.getPages({
            category: 'legal',
            language,
            limit: 50 // Get all legal pages
        });
    }

    /**
     * Get recent blog posts for homepage or sidebar
     */
    async getRecentBlogPosts(language = 'fr', limit = 5) {
        const result = await this.getBlogPosts({ language, limit });
        return result.pages;
    }
}

export default new ContentService();
