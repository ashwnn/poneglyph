import { Feather, Zap, Sparkles, Brain } from 'lucide-react';

export const MODELS = [
    {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        actualApiId: 'gemini-2.5-flash-lite', // Using newer model mapping
        speed: 'Ultra Fast',
        contextWindow: '1M tokens',
        icon: Feather,
        color: 'text-green-400',
        pricing: {
            input: '$0.05 / 1M tokens',
            output: '$0.20 / 1M tokens',
        },
        description: 'The most cost-effective option for simple tasks and high-volume operations.',
        features: ['Lowest latency', 'Lowest cost', 'Good for basic queries'],
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        actualApiId: 'gemini-2.5-flash',
        speed: 'Fast',
        contextWindow: '1M tokens',
        icon: Zap,
        color: 'text-yellow-400',
        pricing: {
            input: '$0.075 / 1M tokens',
            output: '$0.30 / 1M tokens',
        },
        description: 'Optimized for speed and efficiency. Best for most standard use cases.',
        features: ['Fast responses', 'Cost-effective', 'Large context window'],
    },
    {
        id: 'gemini-3.0-flash',
        name: 'Gemini 3.0 Flash',
        actualApiId: 'gemini-2.0-flash-exp', // Mapping 3.0-flash to 2.0-flash-exp as per original code intent
        speed: 'Fast',
        contextWindow: '2M tokens',
        icon: Sparkles,
        color: 'text-orange-400',
        pricing: {
            input: '$0.10 / 1M tokens',
            output: '$0.40 / 1M tokens',
        },
        description: 'Next-generation efficiency with improved reasoning capabilities.',
        features: ['Enhanced reasoning', '2M context window', 'Multimodal native'],
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        actualApiId: 'gemini-1.5-pro', // Mapping 2.5 Pro to 1.5 Pro
        speed: 'Moderate',
        contextWindow: '2M tokens',
        icon: Brain,
        color: 'text-purple-400',
        pricing: {
            input: '$1.25 / 1M tokens',
            output: '$5.00 / 1M tokens',
        },
        description: 'Advanced reasoning and complex problem-solving capabilities.',
        features: ['Advanced reasoning', 'Complex queries', 'Extended context'],
    },
    {
        id: 'gemini-3.0-pro',
        name: 'Gemini 3.0 Pro',
        actualApiId: 'gemini-1.5-pro', // Fallback to 1.5 Pro until 2.0 Pro is GA
        speed: 'Deep',
        contextWindow: '2M tokens',
        icon: Brain,
        color: 'text-blue-400',
        pricing: {
            input: '$2.50 / 1M tokens',
            output: '$10.00 / 1M tokens',
        },
        description: 'The most capable model for highly complex reasoning and creative tasks.',
        features: ['State-of-the-art', 'Best-in-class reasoning', 'Complex analysis'],
    },
] as const;

export type ModelId = (typeof MODELS)[number]['id'];

export const DEFAULT_MODEL: ModelId = 'gemini-2.5-flash';

export function getModelById(id: string) {
    return MODELS.find((m) => m.id === id) || MODELS.find((m) => m.id === DEFAULT_MODEL)!;
}

export function getApiId(id: string) {
    const model = getModelById(id);
    return model?.actualApiId || 'gemini-1.5-flash';
}
