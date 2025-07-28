import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://nhevqlafdvwvjhmqqqjn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZXZxbGFmZHZ3dmpobXFxcWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzEwMjEsImV4cCI6MjA2ODI0NzAyMX0.-x8nqE5-gs9aytM1TmINFSTBYwXI2e7QmDW4QLAkob8"
);

export { supabase as s };
