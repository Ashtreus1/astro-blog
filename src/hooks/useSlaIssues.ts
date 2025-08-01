import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Issue {
  issue: string;
  priority: 'Low' | 'Medium' | 'High';
}

export const useSlaIssues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      const { data, error } = await supabase
        .from('sla_policy')
        .select('issue, priority');

      if (error) {
        setError(error);
      } else {
        setIssues(data as Issue[]);
      }
    };

    fetchIssues();
  }, []);

  return { issues, error };
};
