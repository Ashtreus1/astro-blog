import { supabase } from '@/lib/supabaseClient';

export const useCreateTicket = () => {
  return async (
    customerId: string,
    issue: string,
    priority: 'Low' | 'Medium' | 'High'
  ) => {
    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          customer_id: customerId,
          issue,
          priority,
          status: 'Open'
        }
      ])
      .select()
      .single();

    return { data, error };
  };
};
