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


function createUniqueIdForCustomer(phone, email, firstName, lastName) {
  // let unique = "" + phone + email + firstName + lastName;
  let unique = "" + phone + "_" + email;
  return unique;
}


function createUniqueIdForAddress(type, geocode, house_no, street, locality, landmark, postal_code, city, state, country) {
  let unique = "" + type + geocode + house_no + street + locality + landmark + postal_code + city + state + country;
  return unique;
}



function calculateDeliveryDates(isoString, startDate, schedule, totalDeliveryCount) {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const startDateComponents = startDate.split('/');
  const startDay = Number(startDateComponents[0]);
  const startMonth = Number(startDateComponents[1]) - 1; // JavaScript months are 0-based
  const startYear = Number(startDateComponents[2]);
  const startDateObject = new Date(startYear, startMonth, startDay);

  let currentDateObject = startDateObject;
  let currentDeliveryCount = totalDeliveryCount;
  let deliveryDates = [];

  while (currentDeliveryCount > 0) {
    const currentDayOfWeek = weekdays[currentDateObject.getDay()];
    const currentDayIndex = schedule.indexOf(currentDayOfWeek);
    if (currentDayIndex >= 0) {
      // The current day is in the schedule
      const currentDay = currentDateObject.getDate();
      const currentMonth = currentDateObject.getMonth() + 1; // JavaScript months are 0-based
      const currentYear = currentDateObject.getFullYear();
      const deliveryDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
      deliveryDates.push(deliveryDate);
      currentDeliveryCount--;
    }
    currentDateObject.setDate(currentDateObject.getDate() + 1);
  }

  return deliveryDates;
}

function calculateDeliveryCount(quantity, quantityPerDelivery) {
  return Math.ceil(quantity / quantityPerDelivery);
}


function getDeliveryFee(meta) {
  const deliveryFeeObj = meta.find((obj) => obj.key === "deliveryFee"); // Find the object with key "deliveryFee"

  if (deliveryFeeObj) {
    const obj = JSON.parse(deliveryFeeObj.value); // Parse the JSON string into an object
    return obj.deliveryFee; // Return the deliveryFee value
  } else {
    return null; // Return null if the deliveryFee object is not found
  }
}





function formatDateAndTime(isoString) {
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/;
  if (!isoRegex.test(isoString)) {
    // Return the formatted date and time as an object (null, null)
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
    unique: createUniqueIdForCustomer(customerData.phone, customerData.email, customerData.firstName, customerData.lastName),
    // customer_id: customerData.identifier,
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
    if (rawAddresses[i].type === "delivery") {
      let currentAddress = {
        // type, geocode, house_no, street, locality, landmark, postal_code, city, state, country
        unique: createUniqueIdForAddress(
          rawAddresses[i]?.type,
          null, // geocode
          rawAddresses[i]?.streetNumber,
          rawAddresses[i]?.street,
          null, // locality
          null, // landmark
          rawAddresses[i]?.postal_code,
          rawAddresses[i]?.city,
          rawAddresses[i]?.state,
          rawAddresses[i]?.country,
        ),
        //address_id: rawAddresses[i]?.id,
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
  }
  return proccessedAddresses;

}

async function saveCustomerToDatabase(customerData) {
  let { data, error } = await supabase.from('customers').upsert(customerData, { onConflict: "unique" }).select();
  if (!error && data) return data[0]?.customer_id;
  else return null;
}

async function saveAddressesToDatabase(addresses) {
  let { data, error } = await supabase.from('address').upsert([...addresses], { onConflict: "unique" }).select();
  if (!error && data) return data[0]?.address_id;
  else return null;
}

async function saveOrdersToDatabase(orders) {
  const { data, error } = await supabase.from('orders').upsert([...orders]);
  return error;
}

function getDeliveryAddressID(addresses) {
  let delivery_address_id = null;
  for (let i = 0; i < addresses.length; i++) {
    if (addresses[i]?.type === 'delivery') {
      delivery_address_id = addresses[i]?.id;
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
  if (!city) return delivery_type;
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



function getQuantityPerDelivery(orderMeta) {

  let quantityPerDelivery = null;
  for (let i = 0; i < orderMeta?.length; i++) {
    if (orderMeta[i]?.key === 'quantityPerDelivery') {
      if (orderMeta[i]?.value) quantityPerDelivery = parseInt(orderMeta[i]?.value);
      break;
    }
  }
  return quantityPerDelivery;
}

function getStartDate(orderMeta) {
  let startDate = null;
  for (let i = 0; i < orderMeta?.length; i++) {
    if (orderMeta[i].key === 'startDate') {
      startDate = orderMeta[i]?.value;
      break;
    }
  }
  return startDate;
}

function getSchedule(orderMeta) {
  let schedule = null;
  for (let i = 0; i < orderMeta?.length; i++) {
    if (orderMeta[i].key === 'schedule') {
      schedule = orderMeta[i]?.value;
      break;
    }
  }
  return schedule;
}


function resolveScheduledOrders(data, orderDetails, customer_id, delivery_address_id) {


  let orders = [];
  // find out the number of single orders to create
  let quantityPerDelivery = getQuantityPerDelivery(orderDetails?.meta);
  let quantity = orderDetails?.quantity;
  let totalDeliveryCount = calculateDeliveryCount(quantity, quantityPerDelivery);
  let schedule = getSchedule(orderDetails?.meta);
  let startDate = getStartDate(orderDetails?.meta);
  let deliveryDates = calculateDeliveryDates(data?.order?.get?.createdAt, startDate, schedule, totalDeliveryCount);
  let deliveryLeft = quantity;
  for (let i = 0; i < totalDeliveryCount; i++) {


    let currentQuantity;
    let currentOrderType = "Subs";
    if (i === totalDeliveryCount - 1) {
      currentOrderType = "Subs (L)";
    }

    if (deliveryLeft - quantityPerDelivery >= 0) {
      deliveryLeft = deliveryLeft - quantityPerDelivery;
      currentQuantity = quantityPerDelivery;
    }
    else {
      currentQuantity = deliveryLeft;
      deliveryLeft = 0;
    }

    let current_nmv = (orderDetails?.price?.net * currentQuantity) / quantity;
    let current_gmv = (orderDetails?.price?.gross * currentQuantity) / quantity;



    let order = {
      order_id: data?.order?.get?.id,
      created_at_date: formatDateAndTime(data?.order?.get?.createdAt).date,
      created_at_time: formatDateAndTime(data?.order?.get?.createdAt).time,
      order_nmv: orderDetails?.price?.net, // current_nmv,
      order_gmv: orderDetails?.price?.gross,
      discount: 0,
      discount_code: null, // need to confirm in meeting
      delivery_fee: getDeliveryFee(data?.order?.get?.meta),
      currency: orderDetails?.price?.currency,
      razorpay_order_id: null, // need to confirm in meeting
      razorpay_receipt: null, // need to confirm in meeting
      customer_id: customer_id,
      delivery_address_id: delivery_address_id,
      product_sku: orderDetails?.sku,
      quantity: currentQuantity,
      payment_status: "Paid Online",
      delivery_type: getDeliveryType(getDeliveryAddressCity(data?.order?.get?.customer?.addresses)),
      courier_name: '',
      courier_utr: '',
      delivery_status: 'Scheduled',
      order_type: currentOrderType,
      subs_delivery: `${i + 1}/${totalDeliveryCount}`,
      delivery_date: deliveryDates[i],
      refund_status: null,
    }
    orders.push(order);

  }

  return orders;

}


// either {single: true, order:{}}
// or {single: false, orders: [{}, {}, {}]}
function processOrders(data, customer_id, delivery_address_id) {


  let orders = [];

  for (let i = 0; i < data?.order?.get?.cart?.length; i++) {
    // if Order is single order
    if (isSingleOrder(data?.order?.get?.cart[i])) {
      let order = {
        order_id: data?.order?.get?.id,
        created_at_date: formatDateAndTime(data?.order?.get?.createdAt).date,
        created_at_time: formatDateAndTime(data?.order?.get?.createdAt).time,
        order_nmv: data?.order?.get?.cart[i]?.price?.net,
        order_gmv: data?.order?.get?.cart[i]?.price?.gross,
        discount: 0,
        discount_code: null, // need to confirm in meeting
        delivery_fee: getDeliveryFee(data?.order?.get?.meta),
        currency: data?.order?.get?.cart[i]?.price?.currency,
        razorpay_order_id: null, // need to confirm in meeting
        razorpay_receipt: null, // need to confirm in meeting
        customer_id: customer_id,
        delivery_address_id: delivery_address_id,
        product_sku: data?.order?.get?.cart[i]?.sku,
        quantity: data?.order?.get?.cart[i]?.quantity,
        payment_status: "Paid Online",
        delivery_type: getDeliveryType(getDeliveryAddressCity(data?.order?.get?.customer?.addresses)),
        courier_name: '',
        courier_utr: '',
        delivery_status: 'Not Scheduled',
        order_type: 'Single Order',
        subs_delivery: null,
        delivery_date: addDaysToIsoDate(data?.order?.get?.createdAt, 1),
        refund_status: null,
      }
      orders.push(order);
    }
    // else sheduled
    else {
      let scheduledOrders = resolveScheduledOrders(data, data?.order?.get?.cart[i], customer_id, delivery_address_id);

      orders = [...orders, ...scheduledOrders];
    }
  }

  return orders;


}


serve(async (req: any) => {

  // recieved responseData
  const requestData = await req.json();

  // processCustomerData and save data to database
  const processedCustomerData = processCustomerFromCustomerData(requestData?.order?.get?.customer);
  const proccessedAddresses = processAddressesFromData(requestData);
  let customer_id = await saveCustomerToDatabase(processedCustomerData);

  // process addresses and upsert them to database
  let delivery_address_id = await saveAddressesToDatabase(proccessedAddresses);

  let processedOrders = processOrders(requestData, customer_id, delivery_address_id);
  let error = await saveOrdersToDatabase(processedOrders);









  return new Response(
    JSON.stringify({
      customer: processedCustomerData,
      addresses: proccessedAddresses,
      orders: processedOrders,
      error: error,

    }),
    { headers: { "Content-Type": "application/json" } },
  )
})

