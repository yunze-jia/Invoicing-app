import axios from 'axios';
import { getVbaseData } from './vbase';
// const fs = require("fs").promises;
// const path = require('path')
// const FormData = require("form-data");
export async function getBuyerInvoiceDetails(ctx: any) {
  const newOrderId: any = ctx.vtex.route.params.orderId
  console.log('getBuyerInvoiceDetails  ==> ', newOrderId)
  const {
    vtex: { account, authToken },
    clients: { apps },
  } = ctx
  // const workspace = ctx.req.headers['x-vtex-workspace']
  // const response = await saveImageInCatalog(account,workspace,authToken)
  // console.log('SAVE CATALOG IMAGE - RESPONSE ' , response)
  // if(response.status !== 200 || response.status !== 409){
  //   ctx.body = response
  //   ctx.status = response.status
  //   return
  // }
  console.log({ account, authToken })
  const appId = process.env.VTEX_APP_ID as string
  console.log(appId)
  const customFields = await apps.getAppSettings(appId)
  console.log(customFields)
  const details: any = {
    method: 'GET',
    url: `http://${account}.vtexcommercestable.com.br/api/oms/pvt/orders/${newOrderId}`,
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
      'X-VTEX-Use-Https': 'true',
      VtexIdclientAutCookie: authToken,
    },
  }
  const vbaseNewOrder = newOrderId.split('-')[0]
  const vbase = await getVbaseData(ctx, vbaseNewOrder)
  console.log('vbase****', vbase)
  const orderDetails = await axios
    .request(details)
    .then(function (response: any) {
      console.log('Order Details ==> ', response.data)
      return response.data
    })
    .catch(function (error: any) {
      console.log(error)
      return null
    })
  console.log(orderDetails)
  ctx.status = 200
  ctx.body = { vbase: vbase, data: orderDetails,logo: customFields.logoUrl }
  return
}

export async function getBuyerEmail(ctx: any) {
  try {
    const orderId = ctx.vtex.route.params.orderId
    const newOrderID = orderId.split('-')
    const {
      vtex: { authToken },
      clients: { apps },
    } = ctx

    const appId = process.env.VTEX_APP_ID as string
    const customFields = await apps.getAppSettings(appId)

    console.log(customFields)

    const vbaseData = await getVbaseData(ctx, newOrderID[0])
    const email = vbaseData.newInvoiceData.email

    const host = ctx.request.header['x-forwarded-host']
    const buyerEmail: any = {
      method: 'GET',
      url: `http://conversationtracker.vtex.com.br/api/pvt/emailMapping?an=${host}&alias=${email}`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-VTEX-Use-Https': 'true',
        VtexIdclientAutCookie: authToken,
      },
    }
    let res = await axios.request(buyerEmail)
    ctx.status = 200
    ctx.body = res.data
  } catch (error) {
    ctx.status = 500
    ctx.body = error.message
  }
}

// async function saveImageInCatalog(
//   accountName: string,
//   workspace: string,
//   authToken: string
// ) {
//   console.log({authToken});
  
//   const form = new FormData()
//   const filepath = path.join(__dirname,'../assets/wholalogo.png')
//   // or read from disk
//   const file = await fs.readFile(filepath)
//   form.append('file', file, 'wholalogo.png')

//   // Send form data with axios
//   const response = await axios
//     .post(
//       `http://app.io.vtex.com/vtex.catalog-images/v0/${accountName}/${workspace}/images/save/wholalogo.png`,
//       form,
//       {
//         headers: {
//           'content-type': 'multipart/form-data',
//           // 'X-VTEX-API-AppKey':'vtexappkey-whola-ZDAZTI',
//           // 'X-VTEX-API-AppToken':'LMWQGFRMYINCXIXQTVSHMWNTSSATFQRFVPOUEYLMHVSYAXOMTTOHOFOWOHPREORSUDJVEBQNYAKTZIKNMEMCNWITBHZNRKPSIVGHHJVTUWLFDPYNXLDIUCLVCLNRGZCJ'
//           VtexIdclientAutCookie: authToken,
//           'X-Vtex-Use-Https':true,
//           'Proxy-Authorization': authToken,
//         },
//       }
//     )
//     .then((res: any) => {
//       console.log('SAVE CATALOG IMAGE - SUCCESS ' , res.data)
//       console.log('SAVE CATALOG IMAGE STATUS ' , res.status)
//       return {
//         isError: false,
//         status:res.status,
//         data: res.data,
//       }
//     })
//     .catch((err: any) => {

//       console.log('IMAGE ERROR - ', err);
      
//       console.log('SAVE CATALOG IMAGE - ERROR ' , err.response.data)
//       console.log('SAVE CATALOG IMAGE STATUS ' , err.response.status)
//       return {
//         isError: true,
//         status:err.response?.status,
//         data: err.response?.data,
//       }
//     })

    

//     return response
// }
