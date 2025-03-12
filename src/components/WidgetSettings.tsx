import React from 'react';
import { useChatStore } from '../store/chatStore';

export const WidgetSettings: React.FC = () => {
  const { settings, updateSettings } = useChatStore();
  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Widget Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Business Name</label>
          <input
            type="text"
            name="businessName"
            value={localSettings.businessName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Representative Name</label>
          <input
            type="text"
            name="representativeName"
            value={localSettings.representativeName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Primary Color</label>
            <input
              type="color"
              name="primaryColor"
              value={localSettings.primaryColor}
              onChange={handleChange}
              className="w-full p-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Secondary Color</label>
            <input
              type="color"
              name="secondaryColor"
              value={localSettings.secondaryColor}
              onChange={handleChange}
              className="w-full p-1 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Welcome Message</label>
          <textarea
            name="welcomeMessage"
            value={localSettings.welcomeMessage}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fallback Message</label>
          <textarea
            name="fallbackMessage"
            value={localSettings.fallbackMessage}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};