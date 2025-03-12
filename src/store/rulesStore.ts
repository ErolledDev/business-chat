import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Rule {
  id: string;
  keywords: string[];
  matchType: 'exact' | 'fuzzy' | 'regex' | 'synonym';
  response: string;
  isHtml?: boolean;
}

interface RulesState {
  autoRules: Rule[];
  advancedRules: Rule[];
  loading: boolean;
  initialized: boolean;
  fetchRules: () => Promise<void>;
  addAutoRule: (rule: Omit<Rule, 'id'>) => Promise<void>;
  addAdvancedRule: (rule: Omit<Rule, 'id'>) => Promise<void>;
  updateAutoRule: (rule: Rule) => Promise<void>;
  updateAdvancedRule: (rule: Rule) => Promise<void>;
  deleteAutoRule: (id: string) => Promise<void>;
  deleteAdvancedRule: (id: string) => Promise<void>;
}

export const useRulesStore = create<RulesState>((set, get) => ({
  autoRules: [],
  advancedRules: [],
  loading: false,
  initialized: false,

  fetchRules: async () => {
    // Skip if already initialized
    if (get().initialized) return;

    try {
      set({ loading: true });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch both rule types in parallel
      const [autoResponse, advancedResponse] = await Promise.all([
        supabase
          .from('auto_reply_rules')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('advanced_reply_rules')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (autoResponse.error) throw autoResponse.error;
      if (advancedResponse.error) throw advancedResponse.error;

      set({
        autoRules: autoResponse.data?.map(rule => ({
          id: rule.id,
          keywords: rule.keywords,
          matchType: rule.match_type,
          response: rule.response,
        })) || [],
        advancedRules: advancedResponse.data?.map(rule => ({
          id: rule.id,
          keywords: rule.keywords,
          matchType: rule.match_type,
          response: rule.response,
          isHtml: rule.is_html,
        })) || [],
        initialized: true,
      });
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to load rules');
    } finally {
      set({ loading: false });
    }
  },

  addAutoRule: async (rule) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('auto_reply_rules')
        .insert({
          user_id: user.id,
          keywords: rule.keywords,
          match_type: rule.matchType,
          response: rule.response,
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        autoRules: [...state.autoRules, {
          id: data.id,
          keywords: data.keywords,
          matchType: data.match_type,
          response: data.response,
        }],
      }));

      toast.success('Rule added successfully!');
    } catch (error) {
      console.error('Error adding auto rule:', error);
      toast.error('Failed to add rule');
    }
  },

  addAdvancedRule: async (rule) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('advanced_reply_rules')
        .insert({
          user_id: user.id,
          keywords: rule.keywords,
          match_type: rule.matchType,
          response: rule.response,
          is_html: rule.isHtml,
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        advancedRules: [...state.advancedRules, {
          id: data.id,
          keywords: data.keywords,
          matchType: data.match_type,
          response: data.response,
          isHtml: data.is_html,
        }],
      }));

      toast.success('Rule added successfully!');
    } catch (error) {
      console.error('Error adding advanced rule:', error);
      toast.error('Failed to add rule');
    }
  },

  updateAutoRule: async (rule) => {
    try {
      const { error } = await supabase
        .from('auto_reply_rules')
        .update({
          keywords: rule.keywords,
          match_type: rule.matchType,
          response: rule.response,
        })
        .eq('id', rule.id);

      if (error) throw error;

      set(state => ({
        autoRules: state.autoRules.map(r => 
          r.id === rule.id ? rule : r
        ),
      }));

      toast.success('Rule updated successfully!');
    } catch (error) {
      console.error('Error updating auto rule:', error);
      toast.error('Failed to update rule');
    }
  },

  updateAdvancedRule: async (rule) => {
    try {
      const { error } = await supabase
        .from('advanced_reply_rules')
        .update({
          keywords: rule.keywords,
          match_type: rule.matchType,
          response: rule.response,
          is_html: rule.isHtml,
        })
        .eq('id', rule.id);

      if (error) throw error;

      set(state => ({
        advancedRules: state.advancedRules.map(r => 
          r.id === rule.id ? rule : r
        ),
      }));

      toast.success('Rule updated successfully!');
    } catch (error) {
      console.error('Error updating advanced rule:', error);
      toast.error('Failed to update rule');
    }
  },

  deleteAutoRule: async (id) => {
    try {
      const { error } = await supabase
        .from('auto_reply_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        autoRules: state.autoRules.filter(r => r.id !== id),
      }));

      toast.success('Rule deleted successfully!');
    } catch (error) {
      console.error('Error deleting auto rule:', error);
      toast.error('Failed to delete rule');
    }
  },

  deleteAdvancedRule: async (id) => {
    try {
      const { error } = await supabase
        .from('advanced_reply_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        advancedRules: state.advancedRules.filter(r => r.id !== id),
      }));

      toast.success('Rule deleted successfully!');
    } catch (error) {
      console.error('Error deleting advanced rule:', error);
      toast.error('Failed to delete rule');
    }
  },
}));