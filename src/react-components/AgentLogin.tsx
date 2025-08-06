'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AgentLogin() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data, error } = await supabase
      .from('agents')
      .select('id, role')
      .eq('email', email)
      .single();

    if (error || !data) {
      setError('Agent not found or invalid email.');
    } else {
      window.location.href = `/agents/${data.id}`;
    }
  };

  return (
    <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-80 space-y-4">
      <h1 className="text-xl font-bold text-center">Support Agent Login</h1>
      <Input
        type="email"
        placeholder="Enter agent email"
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
        required
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" className="w-full">Login</Button>
    </form>
  );
}
