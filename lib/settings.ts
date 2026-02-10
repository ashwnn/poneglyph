import { Settings, ChunkingConfig, CustomMetadata } from '@/types';
import { DEFAULT_MODEL, ModelId } from '@/lib/models';

export const DEFAULT_SETTINGS: Settings = {
    globalInstructions: '',
    defaultModel: DEFAULT_MODEL,
    preferShorterAnswers: false,
    enableCitations: true,
    defaultChunking: {
        maxTokensPerChunk: 200,
        maxOverlapTokens: 20,
    },
    defaultMetadataPresets: [],
    theme: 'light',
    showAdvancedControls: false,
};

export function parseSettings(data: any): Settings {
    if (!data || typeof data !== 'object') {
        return { ...DEFAULT_SETTINGS };
    }

    // Helper to safely parse chunking config
    const parseChunking = (c: any): ChunkingConfig | undefined => {
        if (!c || typeof c !== 'object') return DEFAULT_SETTINGS.defaultChunking;
        return {
            maxTokensPerChunk: typeof c.maxTokensPerChunk === 'number' ? c.maxTokensPerChunk : DEFAULT_SETTINGS.defaultChunking?.maxTokensPerChunk,
            maxOverlapTokens: typeof c.maxOverlapTokens === 'number' ? c.maxOverlapTokens : DEFAULT_SETTINGS.defaultChunking?.maxOverlapTokens,
        };
    };

    // Helper to safely parse metadata presets
    const parseMetadata = (m: any): CustomMetadata[] | undefined => {
        if (!Array.isArray(m)) return DEFAULT_SETTINGS.defaultMetadataPresets;
        return m.filter((item) => item && typeof item.key === 'string').map((item) => ({
            key: item.key,
            stringValue: typeof item.stringValue === 'string' ? item.stringValue : undefined,
            numericValue: typeof item.numericValue === 'number' ? item.numericValue : undefined,
        }));
    };

    return {
        globalInstructions: typeof data.globalInstructions === 'string' ? data.globalInstructions : DEFAULT_SETTINGS.globalInstructions,
        defaultModel: (typeof data.defaultModel === 'string' ? data.defaultModel : DEFAULT_SETTINGS.defaultModel) as ModelId, // We could validate against MODELS list here
        preferShorterAnswers: typeof data.preferShorterAnswers === 'boolean' ? data.preferShorterAnswers : DEFAULT_SETTINGS.preferShorterAnswers,
        enableCitations: typeof data.enableCitations === 'boolean' ? data.enableCitations : DEFAULT_SETTINGS.enableCitations,
        defaultChunking: parseChunking(data.defaultChunking),
        defaultMetadataPresets: parseMetadata(data.defaultMetadataPresets),
        theme: typeof data.theme === 'string' ? (data.theme as 'light' | 'dark') : DEFAULT_SETTINGS.theme,
        showAdvancedControls: typeof data.showAdvancedControls === 'boolean' ? data.showAdvancedControls : DEFAULT_SETTINGS.showAdvancedControls,
    };
}
