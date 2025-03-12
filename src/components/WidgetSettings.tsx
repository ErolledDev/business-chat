import React from 'react';
import { useChatStore } from '../store/chatStore';
import { Palette, Code, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const colorSchemes = [
  { name: 'Ocean Blue', primary: '#2563eb', secondary: '#1d4ed8' },
  { name: 'Forest Green', primary: '#16a34a', secondary: '#15803d' },
  { name: 'Royal Purple', primary: '#7c3aed', secondary: '#6d28d9' },
  { name: 'Sunset Orange', primary: '#ea580c', secondary: '#c2410c' },
  { name: 'Berry Red', primary: '#dc2626', secondary: '#b91c1c' },
];

export const WidgetSettings: React.FC = () => {
  const { settings, updateSettings } = useChatStore();
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [copied, setCopied] = React.useState(false);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [userId, setUserId] = React.useState<string>('');

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadSettings(user.id);
      }
    };
    getUser();
  }, []);

  const loadSettings = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (error) throw error;

      if (data) {
        const settings = {
          businessName: data.business_name,
          representativeName: data.representative_name,
          primaryColor: data.primary_color,
          secondaryColor: data.secondary_color,
          welcomeMessage: data.welcome_message,
          fallbackMessage: data.fallback_message,
        };
        setLocalSettings(prev => ({ ...prev, ...settings }));
        updateSettings(settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('widget_settings')
        .upsert({
          user_id: userId,
          business_name: localSettings.businessName,
          representative_name: localSettings.representativeName,
          primary_color: localSettings.primaryColor,
          secondary_color: localSettings.secondaryColor,
          welcome_message: localSettings.welcomeMessage,
          fallback_message: localSettings.fallbackMessage,
        });

      if (error) throw error;

      updateSettings(localSettings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const applyColorScheme = (primary: string, secondary: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      primaryColor: primary,
      secondaryColor: secondary,
    }));
  };

  const installationCode = `<script src="https://business-chat-ai.netlify.app/chat.js"></script>
<script>
  new BusinessChatPlugin({
    uid: "${userId}",
    businessName: "${localSettings.businessName}",
    primaryColor: "${localSettings.primaryColor}",
    secondaryColor: "${localSettings.secondaryColor}"
  });
</script>`;

  const copyInstallationCode = async () => {
    await navigator.clipboard.writeText(installationCode);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Widget Settings
          </h2>
          <p className="text-blue-100 mt-2">
            Customize your chat widget's appearance and behavior
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name</label>
              <input
                type="text"
                name="businessName"
                value={localSettings.businessName}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Representative Name</label>
              <input
                type="text"
                name="representativeName"
                value={localSettings.representativeName}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Color Scheme</label>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showColorPicker ? 'Hide Color Picker' : 'Show Color Picker'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.name}
                  onClick={() => applyColorScheme(scheme.primary, scheme.secondary)}
                  className="p-3 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: scheme.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: scheme.secondary }}
                    />
                  </div>
                  <p className="text-sm font-medium">{scheme.name}</p>
                </button>
              ))}
            </div>

            {showColorPicker && (
              <div className="mt-4">
                <input
                  type="color"
                  name="primaryColor"
                  value={localSettings.primaryColor}
                  onChange={handleChange}
                  className="w-full h-12 p-1 rounded-lg"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Welcome Message</label>
            <textarea
              name="welcomeMessage"
              value={localSettings.welcomeMessage}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fallback Message</label>
            <textarea
              name="fallbackMessage"
              value={localSettings.fallbackMessage}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium">Installation Code</h3>
              </div>
              <button
                onClick={copyInstallationCode}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {installationCode}
            </pre>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};