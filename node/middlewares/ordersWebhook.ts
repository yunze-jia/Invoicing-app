import { json } from 'co-body';
import { createDocumentInvoice } from '../masterdata/invoice';
import { buildBuyerInvoiceInfo, notifyBuyer } from '../services/buyer';
import { extractSellerIds, getSellerEmailById, notifySeller } from '../services/seller';
import { getOrderDetailsWithFilter } from './getOrder';
import { getUser } from './orderHooks';


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

export async function getOrdersList(groupId:any,authToken:any, customFields:any,account:any, ctx:any){
  const {
    vtex: {
      logger
    }
  } = ctx;

  logger.info({
    message : 'ORDER LIST INCOMING PARAMS',
    data : {authToken,customFields,account}
  })
const dates = getStartAndEndDate();
let count = 0;
const searchUrlParams = `?f_creationDate=creationDate:[${dates.startDateTime} TO ${dates.endDateTime}]&f_hasInputInvoice=false`;
const list:any = await getOrderDetailsWithFilter(searchUrlParams,ctx.vtex.authToken,account,customFields)
if(list.isError){
  return list
}


  list.payload.list.map((res:any)=>{
    if(res.orderId.split('-')[0] === groupId){
      count++;
      return
    }
  })
  return {isError:false,data:count};
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
    clients: {masterdata, apps },
  } = ctx
  ctx.status = 200
  const workspace = ctx.req.headers['x-vtex-workspace']
  try {
    if (!payload) {
      ctx.status = 200
      return
    }
    const appId = process.env.VTEX_APP_ID as string
    const customFields = await apps.getAppSettings(appId)
    const orderDetails: any = await buildBuyerInvoiceInfo(
      payload.OrderId,
      ctx,
    )
    const user:any = await getUser(ctx)
    let sellerIds = await extractSellerIds(orderDetails.items)
    const sellerEmail: any = await getSellerEmailById(
      authToken,
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
      masterdata
    )
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
      if (orderDetails.noOfSellers === orderDetails.noOfOrdersInvoiced || orderDetails.noOfSellers === 1) {
        console.log('IN NOTIFY BUYER')
      const buyerDetails = await notifyBuyer(
        payload.OrderId,
        user ? user.user : orderDetails.clientProfileData.email,
        account,
        invoiceNumber.Id,
        customFields,
        workspace,
        ctx
      )
      console.log(buyerDetails)
    }
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
    return
  } catch (e) {
    console.log(e)
    return
  }
}

export async function notify(ctx:any){
  const body:any = await json(ctx.req)
  const {
    vtex: { account, authToken },
  } = ctx
  console.log('IN HOOK',authToken);​
  const workspace = ctx.req.headers['x-vtex-workspace']
  const res = await notifyBuyer(body.orderId,
    body.email,
    account,
    body.invoiceNo,
    body.marketplaceEmail,
    workspace,
    ctx
    );
  ctx.body = res;
  ctx.status = 200;
  return
}
