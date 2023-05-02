import axios from 'axios'
import { constants } from '../utils/constant'

export async function extractSellerIds(items: any) {
  const ids = items.map((o: any) => o.seller)
  return ids.filter((id: any, index: any) => !ids.includes(id, index + 1))
}

export async function getSellerEmailById(
  authToken: any,
  sellerIds: any,
  account: string,
  customFields: any
) {
  console.log({ customFields })

  const sellerEmails = []
  for (let seller of sellerIds) {
    const options: any = {
      method: 'GET',
      url: `http://${account}.${constants.SELLER_ENDPOINT}${seller}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        // 'X-VTEX-API-AppKey': customFields.app_key,
        // 'X-VTEX-API-AppToken': customFields.app_token,
        'X-VTEX-Use-Https': 'true',
        VtexIdclientAutCookie: authToken,
        'Proxy-Authorization': authToken,
      },
    }

    const email = await axios
      .request(options)
      .then(function (response: any) {
        console.log(
          'getSellerInfo =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=->',
          response.data
        )
        return response.data.Email
      })
      .catch(function (error: any) {
        console.log(error)
      })
    sellerEmails.push({ email: email, sellerId: seller })
  }
  return sellerEmails
}

export async function notifySeller(
  orderId: any,
  data: any,
  account: string,
  invoiceNo: string,
  customFields: any,
  workspace: any,
  ctx: any
) {
  const {
    clients: { email },
  } = ctx
  console.log(
    'the order id is : ' + orderId + ' the account is : ' + account,
    workspace +
      ' cc and email is - ' +
      customFields.marketplace_email +
      data.email
  )
  console.log(
    'seller invoice - ',
    `https://${workspace}--${account}.myvtex.com/invoice/seller/${data.sellerId}/${orderId}/${invoiceNo}`
  )

  const payload = {
    TemplateName: 'order-confirmed',
    applicationName: 'email',
    logEvidence: true,
    jsonData: {
      cc: customFields.marketplace_email,
      email: data.email,
      invoiceUrl: `https://${workspace}--${account}.myvtex.com/invoice/seller/${data.sellerId}/${orderId}/${invoiceNo}`,
      message: 'This is a test',
    },
  }
  const emailRes = await email.notify(account, payload)
  console.log('seller RESPONSE FROM EMAIL REQUEST  - ', { emailRes })
  return emailRes
}
