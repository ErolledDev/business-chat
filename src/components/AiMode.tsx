import React from 'react';
import { Bot } from 'lucide-react';

export const AiMode: React.FC = () => {
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [aiModel, setAiModel] = React.useState('gpt-3.5-turbo');
  const [apiKey, setApiKey] = React.useState('');
  const [context, setContext] = React.useState('');

  const handleSave = () => {
    // TODO: Save AI settings to Supabase
    console.log('Saving AI settings...');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-8 h-8 text-purple-600" />
        <h2 className="text-2xl font-bold">AI Mode Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-lg font-medium">Enable AI Mode</label>
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              aiEnabled ? 'bg-purple-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                aiEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">AI Model</label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!aiEnabled}
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-2">Claude 2</option>
              <option value="custom">Custom Model</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full p-2 border rounded"
              disabled={!aiEnabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Context Information</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={6}
              placeholder="Enter business context and information for the AI to use..."
              className="w-full p-2 border rounded"
              disabled={!aiEnabled}
            />
            <p className="mt-2 text-sm text-gray-500">
              Provide detailed information about your business, products, services, and common customer inquiries.
              This helps the AI provide more accurate and relevant responses.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!aiEnabled}
          className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Save AI Settings
        </button>
      </div>
    </div>
  );
};