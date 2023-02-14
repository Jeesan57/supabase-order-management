// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'



// initialized supabaseClient
const supabase_url = 'https://cllzwjybsifnrmniohek.supabase.co';
const supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbHp3anlic2lmbnJtbmlvaGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzYxMzU2MjIsImV4cCI6MTk5MTcxMTYyMn0._2utFu2ai_4KEIZBGjDLU-R_0r4ef7Ktu3imtD2uxx0'
const supabase = createClient(supabase_url, supabase_anon_key);

// get payload data from supabase request
// step 1:
// get customer data from order
// save customer to db if is not saved
// otherwise, update data

// step 2:
// get addresses from the data
// upsert the addresses data to the address table




function processCustomerFromCustomerData(customerData) {
  if (!customerData) return null;
  let processedCustomerData = {
    customer_id: customerData.identifier,
    phone: customerData.phone,
    email: customerData.email,
    firstname: customerData.firstName,
    lastname: customerData.lastName,
  };
  return processedCustomerData;
}

function processAddressesFromData(data) {
  let proccessedAddresses = [];

  let rawAddresses = data?.order?.get?.customer?.addresses;

  for (let i = 0; i < rawAddresses?.length; i++) {
    let currentAddress = {
      address_id: rawAddresses[i]?.id,
      address_type: rawAddresses[i]?.type,
      geocode: null,
      house_no: rawAddresses[i]?.streetNumber,
      street: rawAddresses[i]?.street,
      locality: null,
      landmark: null,
      postal_code: rawAddresses[i]?.postalCode,
      city: rawAddresses[i]?.city,
      state: rawAddresses[i]?.state,
      country: rawAddresses[i]?.country,
    }
    proccessedAddresses.push(currentAddress);
  }
  return proccessedAddresses;

}

async function saveCustomerToDatabase(customerData) {
  await supabase.from('customers').upsert([customerData]);
}

async function saveAddressesToDatabase(addresses) {
  await supabase.from('address').upsert([...addresses]);
}


serve(async (req: any) => {

  // recieved responseData
  const requestData = await req.json();

  // processCustomerData and save data to database
  const processedCustomerData = processCustomerFromCustomerData(requestData?.order?.get?.customer);
  await saveCustomerToDatabase(processedCustomerData);

  // process addresses and upsert them to database
  const proccessedAddresses = processAddressesFromData(requestData);
  await saveAddressesToDatabase(proccessedAddresses);









  return new Response(
    JSON.stringify({
      customer: processedCustomerData,
      addresses: proccessedAddresses,
    }),
    { headers: { "Content-Type": "application/json" } },
  )
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
