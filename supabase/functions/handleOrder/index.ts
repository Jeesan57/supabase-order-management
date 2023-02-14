// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


// get payload data from supabase request
// 

serve(async (req: any) => {

  const { order } = await req.json()


  const supabase_url = 'https://cllzwjybsifnrmniohek.supabase.co';
  const supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbHp3anlic2lmbnJtbmlvaGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzYxMzU2MjIsImV4cCI6MTk5MTcxMTYyMn0._2utFu2ai_4KEIZBGjDLU-R_0r4ef7Ktu3imtD2uxx0'
  const supabase = createClient(supabase_url, supabase_anon_key);


  let { data, error } = await supabase.from('address').select('*');

  return new Response(
    JSON.stringify({
      data: data,
      order: order
    }),
    { headers: { "Content-Type": "application/json" } },
  )
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
