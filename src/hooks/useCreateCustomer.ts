import { supabase } from '@/lib/supabaseClient';

export const useCreateCustomer = () => {
  return async (name: string, email: string, issue: string) => {
    const { data, error } = await supabase
      .from('customers')
      .upsert({ name, email, issue }, { onConflict: 'email' })
      .select()
      .single();

    return { data, error };
  };
};
