import React from 'react';
import { Plus, Download, Upload, Trash2, Edit } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { useRulesStore } from '../store/rulesStore';

interface Rule {
  id: string;
  keywords: string[];
  matchType: 'exact' | 'fuzzy' | 'regex' | 'synonym';
  response: string;
}

export const AutoReply: React.FC = () => {
  const { autoRules, loading, fetchRules, addAutoRule, updateAutoRule, deleteAutoRule } = useRulesStore();
  const [editingRule, setEditingRule] = React.useState<Rule | null>(null);
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSaveRule = async (rule: Rule) => {
    try {
      setSaving(true);
      if (rule.id === 'new') {
        await addAutoRule(rule);
      } else {
        await updateAutoRule(rule);
      }
      setEditingRule(null);
    } finally {
      setSaving(false);
    }
  };

  const addNewRule = () => {
    const newRule: Rule = {
      id: 'new',
      keywords: [],
      matchType: 'exact',
      response: '',
    };
    setEditingRule(newRule);
  };

  const handleKeywordsChange = (value: string) => {
    if (!editingRule) return;
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    setEditingRule({ ...editingRule, keywords });
  };

  const exportRules = () => {
    const csv = Papa.unparse(autoRules.map(rule => ({
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
    toast.success('Rules exported successfully!');
  };

  const importRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: async (results) => {
        try {
          setSaving(true);
          const importedRules = results.data
            .filter((row: any) => row.keywords && row.matchType && row.response)
            .map((row: any) => ({
              keywords: row.keywords.split(',').map((k: string) => k.trim()),
              matchType: row.matchType as Rule['matchType'],
              response: row.response,
            }));

          for (const rule of importedRules) {
            await addAutoRule(rule);
          }

          toast.success('Rules imported successfully!');
        } catch (error) {
          console.error('Error importing rules:', error);
          toast.error('Failed to import rules');
        } finally {
          setSaving(false);
        }
      },
      header: true,
    });
  };

  if (loading && autoRules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
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
            disabled={saving}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={exportRules}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={saving}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={addNewRule}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            disabled={saving}
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keywords</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {autoRules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{rule.keywords.join(', ')}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{rule.matchType}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-md truncate">{rule.response}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAutoRule(rule.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-medium mb-4">
              {editingRule.id === 'new' ? 'Add New Rule' : 'Edit Rule'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Keywords</label>
                <input
                  type="text"
                  value={editingRule.keywords.join(', ')}
                  onChange={(e) => handleKeywordsChange(e.target.value)}
                  placeholder="Enter keywords, separated by commas"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Match Type</label>
                <select
                  value={editingRule.matchType}
                  onChange={(e) => setEditingRule({ ...editingRule, matchType: e.target.value as Rule['matchType'] })}
                  className="w-full p-2 border rounded"
                >
                  <option value="exact">Exact Match</option>
                  <option value="fuzzy">Fuzzy Match</option>
                  <option value="regex">Regular Expression</option>
                  <option value="synonym">Synonym Match</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Response</label>
                <textarea
                  value={editingRule.response}
                  onChange={(e) => setEditingRule({ ...editingRule, response: e.target.value })}
                  rows={3}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveRule(editingRule)}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};