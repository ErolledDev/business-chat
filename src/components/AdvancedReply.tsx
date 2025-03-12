import React from 'react';
import { Plus, Download, Upload, Trash2, Code } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Rule {
  id: string;
  keywords: string[];
  matchType: 'exact' | 'fuzzy' | 'regex' | 'synonym';
  response: string;
  isHtml: boolean;
}

export const AdvancedReply: React.FC = () => {
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('advanced_reply_rules')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        setRules(data.map(rule => ({
          id: rule.id,
          keywords: rule.keywords,
          matchType: rule.match_type,
          response: rule.response,
          isHtml: rule.is_html,
        })));
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      toast.error('Failed to load advanced reply rules');
    }
  };

  const saveRules = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // First, delete all existing rules
      await supabase
        .from('advanced_reply_rules')
        .delete()
        .eq('user_id', user.id);

      // Then insert new rules
      const { error } = await supabase
        .from('advanced_reply_rules')
        .insert(
          rules.map(rule => ({
            user_id: user.id,
            keywords: rule.keywords,
            match_type: rule.matchType,
            response: rule.response,
            is_html: rule.isHtml,
          }))
        );

      if (error) throw error;
      toast.success('Rules saved successfully!');
    } catch (error) {
      console.error('Error saving rules:', error);
      toast.error('Failed to save rules');
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    const newRule: Rule = {
      id: crypto.randomUUID(),
      keywords: [],
      matchType: 'exact',
      response: '',
      isHtml: false,
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
      isHtml: rule.isHtml,
    })));
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'advanced-reply-rules.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Rules exported successfully!');
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
            isHtml: row.isHtml === 'true',
          }));
        setRules([...rules, ...importedRules]);
        toast.success('Rules imported successfully!');
      },
      header: true,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Advanced Reply Rules</h2>
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
          <button
            onClick={saveRules}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-400"
          >
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              'Save All Rules'
            )}
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Response</label>
                <button
                  onClick={() => updateRule(rule.id, { isHtml: !rule.isHtml })}
                  className={`flex items-center gap-1 px-2 py-1 rounded ${
                    rule.isHtml ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  HTML {rule.isHtml ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <textarea
                value={rule.response}
                onChange={(e) => updateRule(rule.id, { response: e.target.value })}
                rows={3}
                className="w-full p-2 border rounded font-mono"
                placeholder={rule.isHtml ? '<p>Enter HTML response here...</p>' : 'Enter response here...'}
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