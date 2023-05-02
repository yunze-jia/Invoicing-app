import axios from "axios"
import { getVbaseData } from "./vbase"

export async function getBuyerInvoiceDetails(ctx: any) {
    const newOrderId: any = ctx.vtex.route.params.orderId
    console.log('getBuyerInvoiceDetails  ==> ', newOrderId)
    const {
      vtex: { account, authToken },
      clients: { apps },
    } = ctx
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
    console.log('vbase', vbase)
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
    ctx.body = { vbase: vbase, data: orderDetails }
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