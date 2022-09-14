import axios from 'axios'
import { getVbaseData } from './vbase'

export async function getBuyerEmail(ctx: any) {
  try {
    const orderId = ctx.vtex.route.params.orderId
    const newOrderID = orderId.split('-')
    const {
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
      url: `https://conversationtracker.vtex.com.br/api/pvt/emailMapping?an=${host}&alias=${email}`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-VTEX-API-AppKey': 'vtexappkey-vtexasia-SFAJSB',
        'X-VTEX-API-AppToken':
          'ZOLHOEDDEIIPWMNCAPAEGVLKXUBVXUZKCQFHZHFWZQZLITBXPUPBCBZEDBJUCHGJJXMFGFCSJDEPWZBESDGCFXIBQBEYXLTSKPCKGVQJRWRYWKIDZFBYBDELPKOEBEVY',
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