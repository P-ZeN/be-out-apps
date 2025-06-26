export default {
    extends: ["react-app", "react-app/jest"],
    rules: {
        // Custom rule to prevent hardcoded colors in sx prop
        "no-hardcoded-colors": "error",
    },
    overrides: [
        {
            files: ["**/*.jsx", "**/*.js"],
            rules: {
                // Prevent hardcoded color values in common patterns
                "no-restricted-syntax": [
                    "error",
                    {
                        selector:
                            "Property[key.name='sx'] ObjectExpression Property[key.name=/color|backgroundColor|borderColor/] Literal[value=/^(white|black|red|blue|green|yellow|purple|orange|pink|brown|grey|gray|#[0-9a-fA-F]{3,6})$/i]",
                        message:
                            "Avoid hardcoded colors. Use theme.palette values instead. Example: theme.palette.primary.main, theme.palette.background.paper, etc.",
                    },
                    {
                        selector:
                            "Property[key.name='color'] Literal[value=/^(white|black|red|blue|green|yellow|purple|orange|pink|brown|grey|gray|#[0-9a-fA-F]{3,6})$/i]",
                        message: "Avoid hardcoded colors. Use theme.palette values instead.",
                    },
                    {
                        selector:
                            "Property[key.name='backgroundColor'] Literal[value=/^(white|black|red|blue|green|yellow|purple|orange|pink|brown|grey|gray|#[0-9a-fA-F]{3,6})$/i]",
                        message: "Avoid hardcoded backgroundColor. Use theme.palette values instead.",
                    },
                ],
            },
        },
    ],
};
