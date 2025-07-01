// Enhanced category service with multi-language support
import { useTranslation } from "react-i18next";

// Base service functions
export const categoryService = {
    // Fetch categories with language parameter
    getCategories: async (language = "fr") => {
        try {
            const response = await fetch(`/api/events/meta/categories?lang=${language}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching categories:", error);
            throw error;
        }
    },

    // Get all categories with all translations (admin only)
    getAllCategoriesWithTranslations: async () => {
        try {
            const response = await fetch("/api/admin/categories", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching categories with translations:", error);
            throw error;
        }
    },
};

// React hook for easy category fetching with automatic language detection
export const useCategories = () => {
    const { i18n } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await categoryService.getCategories(i18n.language);
            setCategories(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [i18n.language]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return {
        categories,
        loading,
        error,
        refetch: fetchCategories,
    };
};

// Example usage in a component
export const CategoryFilter = () => {
    const { categories, loading, error } = useCategories();
    const [selectedCategory, setSelectedCategory] = useState("");

    if (loading) return <div>Chargement des catégories...</div>;
    if (error) return <div>Erreur: {error}</div>;

    return (
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {categories.map((category) => (
                <option key={category.id} value={category.name}>
                    {category.name} ({category.event_count} événements)
                </option>
            ))}
        </select>
    );
};

// Example for Material-UI Autocomplete
export const CategoryAutocomplete = ({ value, onChange, ...props }) => {
    const { categories, loading } = useCategories();

    return (
        <Autocomplete
            options={categories}
            getOptionLabel={(option) => option.name}
            loading={loading}
            value={value}
            onChange={(event, newValue) => onChange(newValue)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Catégorie"
                    placeholder="Choisissez une catégorie"
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            renderOption={(props, option) => (
                <Box component="li" {...props}>
                    {option.icon && <span style={{ marginRight: 8 }}>{option.icon}</span>}
                    <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        {option.description && (
                            <Typography variant="body2" color="text.secondary">
                                {option.description}
                            </Typography>
                        )}
                    </Box>
                </Box>
            )}
            {...props}
        />
    );
};
