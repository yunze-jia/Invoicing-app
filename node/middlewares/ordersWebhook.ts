import { json } from 'co-body'
import { constants } from '../utils/constant'
import { getVbaseData, saveVbaseData } from './vbase'

const axios = require('axios')


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
    vtex: { account },
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
    if (payload.OrderId.split('-')[1] === '01') {
      const buyerDetails = await notifyBuyer(
        payload.OrderId,
        orderDetails.clientProfileData.email,
        account,
        invoiceNumber.DocumentId,
        customFields,
        workspace,
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
  return orderDetails
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

  return orderDetails
}

async function notifyBuyer(
  orderId: any,
  email: string,
  account: string,
  invoiceNo: string,
  customFields: any,
  workspace: any,
) {
  console.log(
    'the order id is : ' + orderId + ' the account is : ' + account,
    workspace,
  )

  const options = {
    method: 'POST',
    url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/mail-service/pvt/sendmail`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VTEX-API-Appkey': customFields.app_key,
      'X-VTEX-API-AppToken': customFields.app_token,
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
) {
  console.log(
    'the order id is : ' + orderId + ' the account is : ' + account,
    workspace,
  )
  const options = {
    method: 'POST',
    url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/mail-service/pvt/sendmail`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VTEX-API-AppKey': customFields.app_key,
      'X-VTEX-API-AppToken': customFields.app_token,
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
