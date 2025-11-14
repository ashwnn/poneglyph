'use client';

import { ChevronDown, Zap, Brain } from 'lucide-react';

interface ModelSelectorProps {
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  onModelChange: (model: 'gemini-2.5-flash' | 'gemini-2.5-pro') => void;
}

const MODEL_INFO = {
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
    description: 'Optimized for speed and efficiency. Best for most use cases.',
    features: ['Fast responses', 'Cost-effective', 'Large context window'],
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
    features: ['Advanced reasoning', 'Complex queries', 'Extended context (2M)'],
  },
};

export default function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  const currentModel = MODEL_INFO[model];
  const Icon = currentModel.icon;

  return (
    <div className="space-y-2">
      {/* Dropdown */}
      <div className="relative">
        <select
          value={model}
          onChange={(e) =>
            onModelChange(e.target.value as 'gemini-2.5-flash' | 'gemini-2.5-pro')
          }
          className="w-full px-3 py-2 pr-10 text-sm border border-gray-600 rounded-md bg-[#333] text-white focus:outline-none focus:ring-2 focus:ring-[#b82c3b] focus:border-transparent appearance-none cursor-pointer"
          aria-label="Select model"
        >
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Model Details Card */}
      <div className="p-3 bg-[#1a1a1a] border border-gray-700 rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${currentModel.color}`} />
          <h4 className="text-sm font-semibold text-white">{currentModel.name}</h4>
        </div>

        <p className="text-xs text-gray-300">{currentModel.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <div className="text-gray-400">Speed</div>
            <div className="text-white font-medium">{currentModel.speed}</div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-400">Context</div>
            <div className="text-white font-medium">{currentModel.contextWindow}</div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700 space-y-1">
          <div className="text-xs text-gray-400">Pricing (Pay-as-you-go)</div>
          <div className="text-xs space-y-0.5">
            <div className="text-gray-300">
              <span className="text-gray-400">Input:</span> {currentModel.pricing.input}
            </div>
            <div className="text-gray-300">
              <span className="text-gray-400">Output:</span> {currentModel.pricing.output}
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-1">
          {currentModel.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-300">
              <span className="text-[#b82c3b]">•</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
