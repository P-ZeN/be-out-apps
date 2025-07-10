import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
    Box,
    TextField,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
    IconButton,
    Toolbar,
    Tooltip,
} from "@mui/material";
import { 
    Visibility, 
    Code, 
    Preview,
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    FormatListBulleted,
    FormatListNumbered,
    Link,
    Image,
} from "@mui/icons-material";

/**
 * Simple WYSIWYG toolbar component using contentEditable
 * This replaces ReactQuill to avoid deprecated React patterns
 */
const WysiwygToolbar = ({ onCommand, disabled }) => {
    const commands = [
        { command: 'bold', icon: <FormatBold />, tooltip: 'Gras' },
        { command: 'italic', icon: <FormatItalic />, tooltip: 'Italique' },
        { command: 'underline', icon: <FormatUnderlined />, tooltip: 'Souligné' },
        { command: 'insertUnorderedList', icon: <FormatListBulleted />, tooltip: 'Liste à puces' },
        { command: 'insertOrderedList', icon: <FormatListNumbered />, tooltip: 'Liste numérotée' },
        { command: 'createLink', icon: <Link />, tooltip: 'Insérer un lien' },
    ];

    const handleCommand = (command) => {
        if (command === 'createLink') {
            const url = prompt('Entrez l\'URL du lien:');
            if (url) {
                document.execCommand(command, false, url);
                onCommand();
            }
        } else {
            document.execCommand(command, false, null);
            onCommand();
        }
    };

    return (
        <Toolbar variant="dense" sx={{ minHeight: 42, px: 1, borderBottom: '1px solid #e0e0e0' }}>
            {commands.map(({ command, icon, tooltip }) => (
                <Tooltip key={command} title={tooltip}>
                    <IconButton
                        size="small"
                        onClick={() => handleCommand(command)}
                        disabled={disabled}
                        sx={{ mx: 0.25 }}
                    >
                        {icon}
                    </IconButton>
                </Tooltip>
            ))}
        </Toolbar>
    );
};

/**
 * Modern contentEditable-based WYSIWYG editor
 * No deprecated React patterns, no console warnings
 */
const ModernWysiwygEditor = ({ value, onChange, height, placeholder }) => {
    const editorRef = React.useRef(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleToolbarCommand = () => {
        // Trigger change after toolbar command
        setTimeout(handleInput, 0);
    };

    return (
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, height }}>
            <WysiwygToolbar onCommand={handleToolbarCommand} disabled={false} />
            <Box
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleInput}
                sx={{
                    height: `calc(${height} - 42px)`,
                    p: 2,
                    overflow: 'auto',
                    outline: 'none',
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    '&:empty::before': {
                        content: `"${placeholder}"`,
                        color: '#aaa',
                        fontStyle: 'italic',
                    },
                    '& p': {
                        margin: '0 0 1em 0',
                    },
                    '& ul, & ol': {
                        paddingLeft: '2em',
                    },
                }}
            />
        </Box>
    );
};

/**
 * EmailEditor - A multi-mode email content editor component
 * 
 * Supports three editing modes:
 * - WYSIWYG: Modern contentEditable-based rich text editor (no deprecated React patterns)
 * - Code: Raw HTML editor with monospace font
 * - Preview: Live preview of the email content
 * 
 * @param {string} value - The current email content
 * @param {function} onChange - Callback fired when content changes
 * @param {string} height - Editor height (CSS value, default: "300px")
 * @param {boolean} showWysiwyg - Whether to start in WYSIWYG mode (default: false)
 */
const EmailEditor = ({ 
    value = "", 
    onChange, 
    height = "300px", 
    showWysiwyg = false 
}) => {
    const [editorMode, setEditorMode] = useState(showWysiwyg ? "wysiwyg" : "code");
    const [localValue, setLocalValue] = useState(value);

    // Memoize text rows calculation to prevent unnecessary recalculation
    const textRows = useMemo(() => {
        const heightNumber = parseInt(height.replace("px", ""), 10);
        return Math.max(Math.floor(heightNumber / 24), 3); // Minimum 3 rows
    }, [height]);

    // Update local value when prop changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (newValue) => {
        setLocalValue(newValue);
        onChange(newValue);
    };

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            setEditorMode(newMode);
        }
    };

    return (
        <Box>
            {/* Mode Toggle */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <ToggleButtonGroup value={editorMode} exclusive onChange={handleModeChange} size="small" sx={{ mb: 1 }}>
                    <ToggleButton value="wysiwyg" aria-label="wysiwyg editor">
                        <Visibility sx={{ mr: 1 }} />
                        Visuel
                    </ToggleButton>
                    <ToggleButton value="code" aria-label="code editor">
                        <Code sx={{ mr: 1 }} />
                        Code HTML
                    </ToggleButton>
                    <ToggleButton value="preview" aria-label="preview">
                        <Preview sx={{ mr: 1 }} />
                        Aperçu
                    </ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary">
                    Basculer entre les modes d'édition visuelle, code et aperçu
                </Typography>
            </Box>

            {/* Editor Content */}
            {editorMode === "wysiwyg" ? (
                <ModernWysiwygEditor
                    value={localValue}
                    onChange={handleChange}
                    height={height}
                    placeholder="Rédigez le contenu de votre email ici..."
                />
            ) : editorMode === "preview" ? (
                <Box
                    sx={{
                        height: height,
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        overflow: "auto",
                        p: 2,
                        backgroundColor: "#f9f9f9",
                    }}>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                        Aperçu de l'email (variables affichées comme placeholders) :
                    </Typography>
                    <Box
                        sx={{
                            backgroundColor: "white",
                            p: 2,
                            borderRadius: 1,
                            border: "1px solid #ddd",
                            minHeight: "200px",
                        }}
                        dangerouslySetInnerHTML={{ 
                            __html: localValue || "<p>Aucun contenu à prévisualiser</p>" 
                        }}
                    />
                </Box>
            ) : (
                <TextField
                    multiline
                    rows={textRows}
                    fullWidth
                    value={localValue}
                    onChange={(e) => handleChange(e.target.value)}
                    variant="outlined"
                    placeholder="Entrez le code HTML ici..."
                    sx={{
                        "& .MuiInputBase-root": {
                            fontFamily: "monospace",
                            fontSize: "14px",
                        },
                    }}
                />
            )}
        </Box>
    );
};

EmailEditor.propTypes = {
    /** The current email content */
    value: PropTypes.string,
    /** Callback fired when content changes - (newValue: string) => void */
    onChange: PropTypes.func.isRequired,
    /** Editor height as CSS value (e.g., "300px", "50vh") */
    height: PropTypes.string,
    /** Whether to start in WYSIWYG mode instead of code mode */
    showWysiwyg: PropTypes.bool,
};

WysiwygToolbar.propTypes = {
    onCommand: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

ModernWysiwygEditor.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    height: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
};

export default EmailEditor;
