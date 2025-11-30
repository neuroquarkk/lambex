interface LanguageProfile {
    image: string;
    command: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageProfile> = {
    javascript: {
        image: 'rce-javascript:latest',
        command: 'sh -c "cat > /tmp/code.js && node /tmp/code.js"',
    },
    typescript: {
        image: 'rce-typescript:latest',
        command: 'sh -c "cat > /tmp/code.ts && bun run /tmp/code.ts"',
    },
    python: {
        image: 'rce-python:latest',
        command: 'sh -c "cat > /tmp/code.py && python3 /tmp/code.py"',
    },
    c: {
        image: 'rce-c:latest',
        command:
            'sh -c "cat > /tmp/code.c && gcc /tmp/code.c -o /tmp/out && /tmp/out"',
    },
    cpp: {
        image: 'rce-cpp:latest',
        command:
            'sh -c "cat > /tmp/code.cpp && g++ /tmp/code.cpp -o /tmp/out && /tmp/out"',
    },
} as const;
