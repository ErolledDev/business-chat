import React from 'react';
import { Plus, Download, Upload, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

interface Rule {
  id: string;
  keywords: string[];
  matchType: 'exact' | 'fuzzy' | 'regex' | 'synonym';
  response: string;
}

export const AutoReply: React.FC = () => {
  const [rules, setRules] = React.useState<Rule[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const addRule = () => {
    const newRule: Rule = {
      id: crypto.randomUUID(),
      keywords: [],
      matchType: 'exact',
      response: '',
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<Rule>) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const handleKeywordsChange = (id: string, value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    updateRule(id, { keywords });
  };

  const exportRules = () => {
    const csv = Papa.unparse(rules.map(rule => ({
      keywords: rule.keywords.join(', '),
      matchType: rule.matchType,
      response: rule.response,
    })));
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auto-reply-rules.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const importedRules: Rule[] = results.data
          .filter((row: any) => row.keywords && row.matchType && row.response)
          .map((row: any) => ({
            id: crypto.randomUUID(),
            keywords: row.keywords.split(',').map((k: string) => k.trim()),
            matchType: row.matchType as Rule['matchType'],
            response: row.response,
          }));
        setRules([...rules, ...importedRules]);
      },
      header: true,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Auto Reply Rules</h2>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={importRules}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={exportRules}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={addRule}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="p-4 bg-white rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Keywords</label>
                <input
                  type="text"
                  value={rule.keywords.join(', ')}
                  onChange={(e) => handleKeywordsChange(rule.id, e.target.value)}
                  placeholder="Enter keywords, separated by commas"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Match Type</label>
                <select
                  value={rule.matchType}
                  onChange={(e) => updateRule(rule.id, { matchType: e.target.value as Rule['matchType'] })}
                  className="w-full p-2 border rounded"
                >
                  <option value="exact">Exact Match</option>
                  <option value="fuzzy">Fuzzy Match</option>
                  <option value="regex">Regular Expression</option>
                  <option value="synonym">Synonym Match</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Response</label>
              <textarea
                value={rule.response}
                onChange={(e) => updateRule(rule.id, { response: e.target.value })}
                rows={3}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => deleteRule(rule.id)}
                className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};