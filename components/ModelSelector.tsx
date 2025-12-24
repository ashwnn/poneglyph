'use client';

import { ChevronDown, Zap, Brain, Sparkles, Feather } from 'lucide-react';
import { Settings } from '@/types';

// Extract the model type from the Settings interface
type ModelType = Settings['defaultModel'];

interface ModelSelectorProps {
  model: ModelType;
  onModelChange: (model: ModelType) => void;
}

const MODEL_INFO: Record<ModelType, {
  name: string;
  speed: string;
  contextWindow: string;
  icon: any;
  color: string;
  pricing: {
    input: string;
    output: string;
  };
  description: string;
  features: string[];
}> = {
  'gemini-2.5-flash-lite': {
    name: 'Gemini 2.5 Flash Lite',
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
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
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
  'gemini-3.0-flash': {
    name: 'Gemini 3.0 Flash',
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
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
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
  'gemini-3.0-pro': {
    name: 'Gemini 3.0 Pro',
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
};

export default function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  const currentModel = MODEL_INFO[model] || MODEL_INFO['gemini-2.5-flash'];
  const Icon = currentModel.icon;

  return (
    <div className="space-y-4">
      {/* Dropdown */}
      <div className="relative">
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value as ModelType)}
          className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-600 rounded-lg bg-[#333] text-white focus:outline-none focus:ring-2 focus:ring-[#b82c3b] focus:border-transparent appearance-none cursor-pointer hover:bg-[#3a3a3a] transition-colors"
          aria-label="Select model"
        >
          {Object.entries(MODEL_INFO).map(([key, info]) => (
            <option key={key} value={key}>
              {info.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Model Details Card */}
      <div className="p-4 bg-[#1a1a1a] border border-gray-700/50 rounded-xl space-y-4 shadow-lg">
        <div className="flex items-center gap-3 pb-2 border-b border-gray-700/50">
          <div className={`p-2 rounded-lg bg-opacity-20 ${currentModel.color.replace('text-', 'bg-')}`}>
            <Icon className={`w-5 h-5 ${currentModel.color}`} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white leading-none mb-1">{currentModel.name}</h4>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{currentModel.speed} Model</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">
          {currentModel.description}
        </p>

        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="bg-[#222] rounded-lg p-2 border border-gray-800">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Context</div>
            <div className="text-xs text-white font-medium">{currentModel.contextWindow}</div>
          </div>
          <div className="bg-[#222] rounded-lg p-2 border border-gray-800">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Speed</div>
            <div className={`text-xs font-medium ${currentModel.color}`}>{currentModel.speed}</div>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            <span>Pricing</span>
            <div className="h-px bg-gray-700 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Input</div>
              <div className="text-xs text-gray-200 font-mono">{currentModel.pricing.input}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Output</div>
              <div className="text-xs text-gray-200 font-mono">{currentModel.pricing.output}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex flex-wrap gap-2">
            {currentModel.features.map((feature, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 rounded-md bg-[#222] border border-gray-700 text-[10px] text-gray-300"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
