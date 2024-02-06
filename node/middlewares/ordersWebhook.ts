import { json } from 'co-body'
import { createDocumentInvoice } from '../masterdata/invoice'
import { addLog, createLogsSchema } from '../masterdata/logs'
import { buildBuyerInvoiceInfo, notifyBuyer } from '../services/buyer'
import {
  extractSellerIds,
  getSellerEmailById,
  notifySeller,
} from '../services/seller'
import { getVbaseData, saveVbaseData } from './vbase'

let triggers = 0;
export async function trigger(ctx: any, next: () => Promise<any>) {
  // const payload = await json(ctx.req)
  console.log('Invoice triggered - ', ctx.body ?? ctx)
  ctx.status = 200
  await next()
}

export async function ordersWebhook(ctx: any) {
  
  console.log('Triggers -- ',triggers++);
  const payload: any = await json(ctx.req)
  console.log('the payload is  : ', payload)
  const {
    vtex: { account, authToken },
    clients: { masterdata, apps, orderClient },
  } = ctx
  ctx.status = 200
  const workspace = ctx.req.headers['x-vtex-workspace']
  
  const log = {
    invoiceId: null,
    skuId: null,
    orderId: payload.OrderId,
    message: 'Webhooks Called!',
    body: JSON.stringify(payload),
  }
  addLog(ctx, log)


  await createLogsSchema(ctx)
  //Checking if order hook is created for the first time.
  //if first time , then send success status (As order hooks is sending a test request to check if endpoint exists)
  if (payload.hookConfig && payload.hookConfig === 'ping') {
    ctx.status = 200
    ctx.body = ctx.req
    return
  }

  const order = await orderClient.order(payload.OrderId)
  const previousInvoiceNumbers: string = await getVbaseData(ctx, payload.OrderId)
  addLog(ctx,{
    invoiceId: null,
    skuId: null,
    orderId: payload.OrderId,
    message: 'previousInvoiceNumbers - checking if multiple order hooks are triggered using the invoice number.'+ triggers,
    body: JSON.stringify(previousInvoiceNumbers),
  })
  // const previousInvoiceNumbers: string = '65baca0c90526d00017c0c06'
  let invoiceNumbers = order.packageAttachment.packages[0].invoiceNumber
  if (previousInvoiceNumbers) {
    const checkIfAlreadyInvoiced = order.packageAttachment.packages.every(
      (res: any) => {
        console.log('Incoming invoice number from order details - ', res.invoiceNumber)
        const isInvoiceNoSaved = previousInvoiceNumbers.toString().split(',').includes(res.invoiceNumber)
        console.log('isInvoiceNoSaved',{isInvoiceNoSaved});
        invoiceNumbers = !isInvoiceNoSaved ? previousInvoiceNumbers.toString() + ',' +res.invoiceNumber : res.invoiceNumber
        console.log('invoiceNumbers',{invoiceNumbers});
        addLog(ctx,{
          invoiceId: null,
          skuId: null,
          orderId: payload.OrderId,
          message: 'Finding If duplicate invoice trigger using invoice number',
          body: JSON.stringify({
            isInvoiceNoSaved,
            invoiceNumber:res.invoiceNumber,
            invoiceNumbers
          }),
        })
       return isInvoiceNoSaved
      }
    )
    if (checkIfAlreadyInvoiced) {
      addLog(ctx,{
        invoiceId: null,
        skuId: null,
        orderId: payload.OrderId,
        message: 'Already Invoiced!',
        body: JSON.stringify(previousInvoiceNumbers),
      })
      ctx.status = 200
      ctx.body = ctx.req
      return
    }
  }

  const s = await saveVbaseData(payload.OrderId, invoiceNumbers, ctx)
  addLog(ctx,{
    invoiceId: null,
    skuId: null,
    orderId: payload.OrderId,
    message: 'Saved the Invoice numbers in vbase!',
    body: JSON.stringify(s),
  })
  console.log('vbase - ', s)

  try {
    if (!payload) {
      ctx.status = 200
      return
    }
    const appId = process.env.VTEX_APP_ID as string
    const customFields = await apps.getAppSettings(appId)
    const orderDetails: any = await buildBuyerInvoiceInfo(payload.OrderId, ctx)
    let sellerIds = await extractSellerIds(orderDetails.items)
    const sellerEmail: any = await getSellerEmailById(
      authToken,
      sellerIds,
      account,
      customFields
    )
    const date = new Date()
    const body: any = {
      orderId: payload.OrderId,
      customerId: orderDetails.clientProfileData.userProfileId,
      createdDate:
        date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear(),
      sellerId: orderDetails.sellers[0].id,
    }
    const invoiceNumber: any = await createDocumentInvoice(body, masterdata)
    // if (payload.OrderId.split('-')[1] === '01') {
    // let details = await getOrdersList(payload.OrderId.split('-')[0],authToken,customFields,account,ctx)
    // let details = await getOrderDetails(orderDetails.sequence, authToken, account)
    // let details = await orderClient.orderBySequence(`seq${orderDetails.sequence}`)
    // if(details?.isError)
    // {
    //   ctx.body = details?.data;
    //   ctx.status = 500;
    // }
    // console.log('SELLER IDS LENGTH - '+ details.data + ' no of orders invoiced - ' + orderDetails.noOfOrdersInvoiced)
    // if (orderDetails.noOfSellers === orderDetails.noOfOrdersInvoiced || orderDetails.noOfSellers === 1) {
    console.log('IN NOTIFY BUYER & Tracking Url - ', orderDetails.trackingUrl)
    const trackingUrl = orderDetails.trackingUrl
    const brandName = orderDetails?.items[0]?.additionalInfo?.brandName ?? ''
    const buyerDetails = await notifyBuyer(
      payload.OrderId,
      orderDetails?.clientProfileData?.email,
      orderDetails.clientProfileData.firstName,
      account,
      orderDetails.invoiceNumber,
      customFields,
      workspace,
      ctx,
      brandName,
      trackingUrl
    )
    console.log(buyerDetails)
    // }
    if (orderDetails) {
      sellerEmail.forEach(async (data: any) => {
        await notifySeller(
          payload.OrderId,
          data,
          account,
          invoiceNumber.Id,
          customFields,
          workspace,
          ctx
        )
      })
    }
    return
  } catch (e) {
    console.log(e)
    return
  }
}
