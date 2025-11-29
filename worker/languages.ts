interface LanguageProfile {
    image: string;
    command: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageProfile> = {
    javascript: {
        image: 'rce-javascript:latest',
        command: 'sh -c "cat > /tmp/code.js && node /tmp/code.js"',
    },
} as const;
