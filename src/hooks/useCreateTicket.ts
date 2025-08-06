import { supabase } from '@/lib/supabaseClient';

export const useCreateTicket = () => {
  return async (
    customerId: string,
    issue: string,
    priority: 'Low' | 'Medium' | 'High'
  ) => {
    let response_time_seconds = 0;
    if (priority === 'High') response_time_seconds = 300;
    else if (priority === 'Medium') response_time_seconds = 900;

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          customer_id: customerId,
          issue,
          priority,
          status: 'Open',
          response_time_seconds
        }
      ])
      .select()
      .single();

    return { data, error };
  };
};
