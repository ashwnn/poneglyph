'use client';

import { BookOpen, Database, Sparkles } from 'lucide-react';

export default function Onboarding() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Welcome to Poneglyph</h1>
        <p className="text-xl text-gray-300">
          Your RAG-powered document search and chat assistant
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Step 1 */}
        <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-center w-12 h-12 bg-[#b82c3b]/20 rounded-lg">
            <Database className="w-6 h-6 text-[#b82c3b]" />
          </div>
          <h3 className="text-lg font-semibold text-white">1. Create Search Stores</h3>
          <p className="text-sm text-gray-300">
            Use the left sidebar to create file search stores. Upload your documents (PDFs, text files, etc.) to build a knowledge base.
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Click "Create New Store"</p>
            <p>• Give it a descriptive name</p>
            <p>• Upload your documents</p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-center w-12 h-12 bg-[#b82c3b]/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-[#b82c3b]" />
          </div>
          <h3 className="text-lg font-semibold text-white">2. Start Chatting</h3>
          <p className="text-sm text-gray-300">
            Select one or more stores from the sidebar, then ask questions. The AI will search your documents and provide answers.
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Select stores to search</p>
            <p>• Type your question</p>
            <p>• Get AI-powered answers with citations</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-center w-12 h-12 bg-[#b82c3b]/20 rounded-lg">
            <BookOpen className="w-6 h-6 text-[#b82c3b]" />
          </div>
          <h3 className="text-lg font-semibold text-white">3. How RAG Works</h3>
          <p className="text-sm text-gray-300">
            Retrieval-Augmented Generation (RAG) combines document search with AI. Your documents are split into chunks, indexed, and retrieved when relevant.
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Documents are chunked and embedded</p>
            <p>• Relevant chunks are found via semantic search</p>
            <p>• AI generates answers using your docs</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-[#b82c3b] mt-1">•</span>
            <span>
              <strong>API Key Required:</strong> Go to Settings to add your Gemini API key. Get one free from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b82c3b] hover:underline"
              >
                Google AI Studio
              </a>
              .
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#b82c3b] mt-1">•</span>
            <span>
              <strong>Choose Your Model:</strong> Gemini 2.5 Flash is fast and cost-effective. Gemini 2.5 Pro offers advanced reasoning for complex queries.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#b82c3b] mt-1">•</span>
            <span>
              <strong>Manage Conversations:</strong> Use the right sidebar to view, resume, or delete past conversations.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#b82c3b] mt-1">•</span>
            <span>
              <strong>Citations:</strong> When enabled, answers include references to specific documents and sections used to generate the response.
            </span>
          </li>
        </ul>
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-gray-400">
          Ready to get started? Create a store and upload some documents!
        </p>
      </div>
    </div>
  );
}
