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


function formatDateAndTime(isoString) {
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/;
  if (!isoRegex.test(isoString)) {
    // Return the formatted date and time as an object
    return { date: null, time: null };
  }

  const date = new Date(isoString);

  // Get the date components
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Get the time components
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Format the date and time strings
  const dateString = `${day}/${month}/${year}`;
  const timeString = `${hours}:${minutes}:${seconds}`;

  // Return the formatted date and time as an object
  return { date: dateString, time: timeString };
}


function addDaysToIsoDate(isoString, days) {
  const date = new Date(isoString);
  const newDate = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, '0');
  const day = String(newDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}





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


function getDeliveryAddressID(addresses) {
  let delivery_address_id = null;
  for (let i = 0; i < addresses.length; i++) {
    if (addresses[i]?.type === 'delivery') {
      delivery_address_id = addresses[i]?.address_id;
      break;
    }
  }
  return delivery_address_id;
}

function getDeliveryAddressCity(addresses) {
  let delivery_address_city = null;
  for (let i = 0; i < addresses.length; i++) {
    if (addresses[i]?.type === 'delivery') {
      delivery_address_city = addresses[i]?.city;
      break;
    }
  }
  return delivery_address_city;
}

// Mumbai => mumbai MumBai => lowecase
// mumbai => mumbai hyperlocal

function getDeliveryType(city) {
  // "if city = mumbai”, “मुंबई“, “thane”, “ठाणे, ""Navi Mumbai"" , ""नवी मुंबई""
  // then Delivery Type = Mumbai_hyperlocal
  // else Delivery Type = rest_of_India"
  let delivery_type = "rest_of_India";
  // check city case (capital/small)
  if (
    city.toLowerCase() === "mumbai" ||
    city === "मुंबई" ||
    city.toLowerCase() === "thane" ||
    city === "ठाणे" ||
    city.toLowerCase() === "navi mumbai"
    || city === "नवी मुंबई") {
    delivery_type = "Mumbai_hyperlocal";
  }
  return delivery_type;
}

function isSingleOrder(order) {
  let isSingle = true;
  // "if product metadata path = /category/flexi-subscriptions/*
  // then Subs for for 1 - (n - 1) and Subs(L) for nth
  // else Single Order"

  // str.includes('MongoDB')

  for (let i = 0; i < order?.meta?.length; i++) {
    if (order?.meta[i].key === "path") {
      let pathValue = order?.meta[i].value;
      if (pathValue.includes('category/flexi-subscriptions')) {
        isSingle = false;
        break;
      }
    }
  }

  return isSingle;


}


// either {single: true, order:{}}
// or {single: false, orders: [{}, {}, {}]}
function processOrders(data) {


  let orders = [];

  for (let i = 0; i < data?.order?.get?.cart?.length; i++) {
    // if Order is single order
    if (isSingleOrder(data?.order?.get?.cart[i])) {
      let order = {
        order_id: data?.order?.get?.id,
        created_at_date: formatDateAndTime(data?.order?.get?.createdAt).date, // need to change
        created_at_time: formatDateAndTime(data?.order?.get?.createdAt).time, // need to change
        order_nmv: data?.order?.get?.cart[i]?.price?.net,
        order_gmv: data?.order?.get?.cart[i]?.price?.gross,
        discount: 0, // need to confirm in meeting
        discount_code: null, // need to confirm in meeting
        delivery_fee: null, // need to confirm in meeting
        currency: data?.order?.get?.cart[i]?.price?.currency,
        razorpay_order_id: null, // need to confirm in meeting
        razoerpay_receipt: null, // need to confirm in meeting
        customer_id: data?.order?.get?.customer?.identifier,
        delivery_address_id: getDeliveryAddressID(data?.order?.get?.customer?.addresses),
        product_sku: data?.order?.get?.cart[i]?.sku,
        quantity: data?.order?.get?.cart[i]?.quantity,
        payment_status: "Paid Online",
        delivery_type: getDeliveryType(getDeliveryAddressCity(data?.order?.get?.customer?.addresses)),
        courier_name: '',
        courier_utr: '',
        delivery_status: 'Not Scheduled',
        order_type: 'Single Order',
        subs_delivery: null,
        delivery_date: addDaysToIsoDate(data?.order?.get?.createdAt, 1), // need to change
        refund_status: null,
      }
      orders.push(order);
    }
    // else sheduled
    else {

    }
  }

  return orders;


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

  let processedOrders = processOrders(requestData);









  return new Response(
    JSON.stringify({
      customer: processedCustomerData,
      addresses: proccessedAddresses,
      orders: processedOrders,

    }),
    { headers: { "Content-Type": "application/json" } },
  )
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
