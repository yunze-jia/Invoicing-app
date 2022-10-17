import { json } from 'co-body'
import { constants } from '../utils/constant'
import { getVbaseData, saveVbaseData } from './vbase'

const axios = require('axios')

function getStartAndEndDate(){
  const date = new Date();
  let startDateTime ;
  let endDateTime;
  let startdays = 7;
  let start = new Date(date.getTime() - (startdays * 24 * 60 * 60 * 1000));
  startDateTime = start.getFullYear() + '-' + (start.getMonth() + 1) + '-' + (start.getDate()) +'T00:00:00.000Z';
  let enddays = 1;
  let end = new Date(date.getTime() + (enddays * 24 * 60 * 60 * 1000));
  endDateTime = end.getFullYear() + '-' + (end.getMonth() + 1) + '-' + (end.getDate() ) +'T00:00:00.000Z';
  return {startDateTime, endDateTime}

}

export async function getOrdersList(groupId:any,authToken:any, customFields:any){
  console.log('auth token while getting orders list',authToken)
  console.log('custom fields while getting orders list',customFields)
const dates = getStartAndEndDate();
let count = 0;
const options = {
  method: 'GET',
  url: `http://vtexasia.vtexcommercestable.com.br/api/oms/pvt/orders?f_creationDate=creationDate:[${dates.startDateTime} TO ${dates.endDateTime}]&f_hasInputInvoice=false`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    "X-VTEX-Use-Https": "true", 
    'VtexIdclientAutCookie':authToken
    // 'X-VTEX-API-AppKey': customFields.app_key,
    // 'X-VTEX-API-AppToken': customFields.app_token
  }
};

const list = await axios
  .request(options)
  .then(function (response:any) {
    // console.log('Order List : ',response.data);
    return {isError:false,payload:response.data}
  })
  .catch(function (error:any) {
    console.error('ERROR IN ORDER LIST',error.response);
    return {isError:false,payload:error.response};
  });
if(list.isError){
  return list.payload;
}
  list.list.map((res:any)=>{
    if(res.orderId.split('-')[0] === groupId){
      count++;
      return
    }
  })
  return count;
}

export async function ordersWebhook(ctx: any) {
  const payload: any = await json(ctx.req)
  console.log('the payload is  : ', payload)

  //Checking if order hook is created for the first time.
  //if first time , then send success status (As order hooks is sending a test request to check if endpoint exists)
  if (payload.hookConfig && payload.hookConfig === 'ping') {
    ctx.status = 200
    ctx.body = ctx.req
    return
  }
  const {
    vtex: { account, authToken },
    clients: { apps },
  } = ctx
  ctx.status = 200
  const workspace = ctx.req.headers['x-vtex-workspace']
  console.log('workspace=======>', workspace)
  try {
    //
    if (!payload) {
      ctx.status = 200
      return
    }
    const appId = process.env.VTEX_APP_ID as string
    const customFields = await apps.getAppSettings(appId)
    console.log({ customFields })
    const orderDetails: any = await getOrderDetails(
      payload.OrderId,
      account,
      customFields,
      ctx,
    )
    let sellerIds = await extractSellerIds(orderDetails.items)
    console.log('Order Details ========>', JSON.stringify(orderDetails))
    const sellerEmail: any = await getSellerEmailById(
      sellerIds,
      account,
      customFields,
    )
    const date = new Date()
    const body: any = {
      orderId: payload.OrderId,
      customerId: orderDetails.clientProfileData.userProfileId,
      createdDate:
        date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear(),
      sellerId: orderDetails.sellers[0].id,
    }
    const invoiceNumber: any = await createDocumentInvoice(
      body,
      account,
      customFields,
    )
    // if (payload.OrderId.split('-')[1] === '01') {
      let noOfSellers = await getOrdersList(payload.OrderId.split('-')[0],authToken,customFields)
      console.log('SELLER IDS LENGTH - '+ noOfSellers + 'no of orders invoiced - ' + orderDetails.noOfOrdersInvoiced)
      if (noOfSellers === orderDetails.noOfOrdersInvoiced || noOfSellers === 1) {
      const buyerDetails = await notifyBuyer(
        payload.OrderId,
        orderDetails.clientProfileData.email,
        account,
        invoiceNumber.DocumentId,
        customFields,
        workspace,
        authToken
      )
      console.log(buyerDetails)
    }
    sellerEmail.forEach(async (data: any) => {
      await notifySeller(
        payload.OrderId,
        data,
        account,
        invoiceNumber.DocumentId,
        customFields,
        workspace,
        authToken
      )
    })
    return
  } catch (e) {
    console.log(e)
    return
  }
}

async function extractSellerIds(items: any) {
  const ids = items.map((o: any) => o.seller)
  return ids.filter(
    (id: any, index: any) => !ids.includes(id, index + 1),
  )
}

//Create Document Invoice
async function createDocumentInvoice(
  data: any,
  account: string,
  customFields: any,
) {
  const options = {
    method: 'POST',
    url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/dataentities/${constants.INVOICE_DATA_ENTITITY_NAME}/documents?_schema=${constants.INVOICE_SCHEMA}`,
    headers: {
      Accept: 'application/vnd.vtex.ds.v10+json',
      'Content-Type': 'application/json',
      'X-VTEX-API-Appkey': customFields.app_key,
      'X-VTEX-API-AppToken': customFields.app_token,
    },
    data: data,
  }
  const invoice_document = await axios
    .request(options)
    .then(function(response: any) {
      console.log('create document for invoice : ', response.data)
      return response.data
    })
    .catch(function(error: any) {
      console.error(error)
    })
  return invoice_document
}

//GET ORDER DETAILS
async function getOrderDetails(
  orderId: any,
  account: string,
  customFields: any,
  ctx: any,
) {
  const options = {
    method: 'GET',
    url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/oms/pvt/orders/${orderId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VTEX-API-Appkey': customFields.app_key,
      'X-VTEX-API-AppToken': customFields.app_token,
    },
  }
  const orderDetails = await axios
    .request(options)
    .then(function(response: any) {
      console.log(response.data)
      return response.data
    })
    .catch(function(error: any) {
      console.log(error)
      return error
    })
  console.log('orderDetails=====>', orderDetails)

  const newBuyerOrderDetails: any = await getBuyerInvoiceDetails(
    orderId,
    account,
    customFields,
    ctx,
  )
  console.log('New buyer Order Details ========>', newBuyerOrderDetails)
  orderDetails.noOfOrdersInvoiced = newBuyerOrderDetails.noOfOrdersInvoiced;
  return orderDetails;
}

//get Buyer order details
const getBuyerInvoiceDetails = async (
  orderId: any,
  account: string,
  customFields: any,
  ctx: any,
) => {
  console.log('getBuyerInvoiceDetails was called')

  const newOrderId = orderId.split('-')
  // console.log('orderId in orderDails===>', orderId, newOrderId)
  const options = {
    method: 'GET',
    url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/oms/pvt/orders/${orderId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VTEX-API-Appkey': customFields.app_key,
      'X-VTEX-API-AppToken': customFields.app_token,
    },
  }

  let saveToVbaseResponse
  const orderDetails = await axios
    .request(options)
    .then(function(response: any) {
      console.log('order details response----->', response.data)
      console.log('shippingdata --> ', JSON.stringify(response.data.shippingData.logisticsInfo) )
      return response.data
    })
    .catch(function(error: any) {
      console.log(error)
    })

  const vbaseOrderDetails: any = await getVbaseData(ctx, newOrderId[0])
  console.log({ vbaseOrderDetails })
  let shippingData = orderDetails.shippingData
  let invoiceData = {
    status: orderDetails.status,
    name:
      orderDetails.clientProfileData.firstName +
      ' ' +
      orderDetails.clientProfileData.lastName,
    email: orderDetails.clientProfileData.email,
    creationDate: orderDetails.creationDate,
    // soldBy: orderDetails.sellers[0].name,
    lastChange: orderDetails.lastChange,
  }
  if (vbaseOrderDetails != null) {

    let changeobj: any = orderDetails.items.map((data: any) => ({
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      priceDefinition: data.priceDefinition,
      unitPrice: data.sellingPrice,
      orderCommission: data.commission,
      refId: data.refId,
    }))

    vbaseOrderDetails[newOrderId[1]] = { items: changeobj }
    vbaseOrderDetails[newOrderId[1]].totals = orderDetails.totals
    vbaseOrderDetails[newOrderId[1]].grandTotal = orderDetails.value
    vbaseOrderDetails[newOrderId[1]].sellers = orderDetails.sellers
    vbaseOrderDetails['shippingData'] = shippingData

    console.log('orderDetails.sellers===>', orderDetails.sellers, 'seller==>', orderDetails.sellers[0].name)

    vbaseOrderDetails['orderId'] = orderDetails.orderId.split('-')[0]
    vbaseOrderDetails['newInvoiceData'] = invoiceData

    console.log('Order Id save in order webhook-->', newOrderId[0])

    saveToVbaseResponse = await saveVbaseData(
      newOrderId[0],
      vbaseOrderDetails,
      ctx,
    )
  } else {
    let saveObj: any = {}
    const items = orderDetails.items.map((data: any) => ({
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      priceDefinition: data.priceDefinition,
      unitPrice: data.sellingPrice,
      orderCommission: data.commission,
      refId: data.refId,
    }))
    saveObj[newOrderId[1]] = { items: items }
    saveObj[newOrderId[1]].totals = orderDetails.totals
    saveObj[newOrderId[1]].grandTotal = orderDetails.value
    saveObj[newOrderId[1]].sellers = orderDetails.sellers
    saveObj['shippingData'] = shippingData
    saveObj['newInvoiceData'] = invoiceData
    saveObj['orderId'] = orderDetails.orderId.split('-')[0]
    console.log('Order Id save-->', newOrderId[0])
    console.log({ saveObj })
    saveToVbaseResponse = await saveVbaseData(newOrderId[0], saveObj, ctx)
  }
  console.log('Order Id save-->', newOrderId[0])
  const vbaseOrderDetails1: any = await getVbaseData(ctx, newOrderId[0])

  // console.log('Vbase Save response-------> ', saveToVbaseResponse)
  // console.log('Vbase Get saved response-------> ', vbaseOrderDetails1)
  console.log('vBase=======>', {
    saveToVbaseResponse,
    newOrderId,
    orderDetails,
    vbaseOrderDetails,
    vbaseOrderDetails1,
  })
   
  orderDetails.noOfOrdersInvoiced = (vbaseOrderDetails && Object.keys(vbaseOrderDetails).filter((res:any)=>{
    if(!isNaN(res)) return res;
  }).length )?? 0;
  console.log('NoOFordersINvoiced created - ',orderDetails.noOfOrdersInvoiced);
  
  return orderDetails
}

async function notifyBuyer(
  orderId: any,
  email: string,
  account: string,
  invoiceNo: string,
  customFields: any,
  workspace: any,
  authToken:any
) {
  console.log(
    'the order id is : ' + orderId + ' the account is : ' + account,
    workspace,
  )

  const options = {
    method: 'POST',
    url: `http://${account}.${constants.VTEX_COMMERCE_BASE_URL}/mail-service/pvt/sendmail`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      "X-VTEX-Use-Https": "true",
      VtexIdClientAutCookie: authToken,

      // 'X-VTEX-API-Appkey': customFields.app_key,
      // 'X-VTEX-API-AppToken': customFields.app_token,
    },
    data: {
      TemplateName: 'order-confirmed',
      applicationName: 'email',
      logEvidence: false,
      jsonData: {
        cc: customFields.marketplace_email,
        email: email,
        invoiceUrl: `https://${workspace}--vtexasia.myvtex.com/invoice/buyer/${orderId}/${invoiceNo}`,
        message: 'This is a test',
      },
    },
  }
  // console.log('BuyerEmail==========>', options.data)

  const emailRes = await axios
    .request(options)
    .then(function(response: any) {
      console.log(response.data)
      return response.data
    })
    .catch(function(error: any) {
      console.log(error)
    })
  // console.log('buyer email res', emailRes)
  return emailRes
}

async function notifySeller(
  orderId: any,
  data: any,
  account: string,
  invoiceNo: string,
  customFields: any,
  workspace: any,
  authToken:any
) {
  console.log(
    'the order id is : ' + orderId + ' the account is : ' + account,
    workspace,
  )
  const options = {
    method: 'POST',
    url: `http://${account}.${constants.VTEX_COMMERCE_BASE_URL}/mail-service/pvt/sendmail`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      "X-VTEX-Use-Https": "true",
      VtexIdClientAutCookie:authToken
      // 'X-VTEX-API-AppKey': customFields.app_key,
      // 'X-VTEX-API-AppToken': customFields.app_token,
    },
    data: {
      TemplateName: 'order-confirmed',
      applicationName: 'email',
      logEvidence: false,
      jsonData: {
        cc: customFields.marketplace_email,
        email: data.email,
        invoiceUrl: `https://${workspace}--vtexasia.myvtex.com/invoice/seller/${data.sellerId}/${orderId}/${invoiceNo}`,
        message: 'This is a test',
      },
    },
  }

  const emailRes = await axios
    .request(options)
    .then(function(response: any) {
      console.log(response.data)
      return response.data
    })
    .catch(function(error: any) {
      console.log(error)
    })
  return emailRes
}

export async function getSellerEmailById(
  sellerIds: any,
  account: string,
  customFields: any,
) {
  const sellerEmails = []
  for (let seller of sellerIds) {
    const options = {
      method: 'GET',
      url: `https://${account}.${constants.SELLER_ENDPOINT}${seller}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VTEX-API-AppKey': customFields.app_key,
        'X-VTEX-API-AppToken': customFields.app_token,
      },
    }

    const email = await axios
      .request(options)
      .then(function(response: any) {
        console.log(
          'getSellerInfo =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=->',
          response.data,
        )
        return response.data.Email
      })
      .catch(function(error: any) {
        console.log(error)
      })
    sellerEmails.push({ email: email, sellerId: seller })
  }
  return sellerEmails
}
