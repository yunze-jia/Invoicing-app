import { getSellerEmailById } from '../services/seller'

export async function sellerInvoiceInfo(ctx: any) {
  const newSellerId: any = []
  newSellerId.push(ctx.vtex.route.params.sellerId)
  const {
    vtex: { account,authToken },
    clients: { apps },
  } = ctx
  ctx.status = 200

  const appId = process.env.VTEX_APP_ID as string
  const customFields = await apps.getAppSettings(appId)
  if (newSellerId) {
    const sellerInvoiceData = await getSellerEmailById(
      authToken,
      newSellerId,
      account,
      customFields
    )
    ctx.body = sellerInvoiceData
  } else {
    console.log('order id not found for seller invoice')
  }
}
