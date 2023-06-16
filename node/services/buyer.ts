import {
  extractPreOrderInfo,
  findEachItemPreOrder,
} from '../middlewares/preorder'
import { getSKUSpecifications } from '../middlewares/specifications'
import { getVbaseData, saveVbaseData } from '../middlewares/vbase'

//
export const buildBuyerInvoiceInfo = async (orderId: any, ctx: any) => {
  const {
    vtex: { account, authToken },
    clients: { orderClient, preOrder, apps },
  } = ctx
  const appId = process.env.VTEX_APP_ID as string
  const customFields = await apps.getAppSettings(appId)
  let saveToVbaseResponse
  const newOrderId = orderId.split('-')
  const orderDetails = await orderClient.order(orderId)
  const vbaseOrderDetails: any = await getVbaseData(ctx, newOrderId[0])
  console.log('Vbase order details - ', { vbaseOrderDetails })
  console.log('Get ORder by Id  - ', newOrderId[0])
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

  // const preOrderInfo = await getPreOrderInfo(constants.API_KEY, newOrderId[0],authToken)
  const preOrderDetails = await preOrder.getPreOrder(
    newOrderId[0],
    customFields
  )
  console.log('PREORDER INFO - ', preOrderDetails)

  let isPreorder = await findEachItemPreOrder(
    preOrderDetails.products,
    orderDetails.items,
    true
  )
  console.log('All items are preorder - ', isPreorder)
  isPreorder = isPreorder
    ? isPreorder
    : await findEachItemPreOrder(
        preOrderDetails.products,
        orderDetails.items,
        false
      )
  console.log('All items are standard ordder - ', isPreorder)
  let preorderPayment: Preorder = {
    depositPayment: 0,
    balancePayment: 0,
    balanceDue: 0,
  }
  let priceWithShipment =
    orderDetails.totals.filter((res: any) => res.id === 'Shipping')[0].value /
    100

  if (vbaseOrderDetails != null) {
    let changeobj = []
    for (const item of orderDetails.items) {
      if (isPreorder) {
        const { depositPayment, balancePayment, balanceDue } =
          await extractPreOrderInfo(preOrderDetails, item)
        preorderPayment.depositPayment =
          preorderPayment.depositPayment + depositPayment
        preorderPayment.balancePayment =
          preorderPayment.balancePayment + balancePayment
        preorderPayment.balanceDue = preorderPayment.balanceDue + balanceDue
      }

      changeobj.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        priceDefinition: item.priceDefinition,
        unitPrice: item.sellingPrice,
        orderCommission: item.commission,
        refId: item.refId,
        tax: item.tax,
        description: await getSKUSpecifications(item.id, account, authToken),
      })
    }

    if (preorderPayment.depositPayment !== 0) {
      preorderPayment.depositPayment =
        preorderPayment.depositPayment + priceWithShipment
    } else {
      preorderPayment.balancePayment =
        preorderPayment.balancePayment + priceWithShipment
    }

    vbaseOrderDetails[newOrderId[1]] = { items: changeobj }
    vbaseOrderDetails[newOrderId[1]].totals = orderDetails.totals
    vbaseOrderDetails[newOrderId[1]].grandTotal = orderDetails.value
    vbaseOrderDetails[newOrderId[1]].sellers = orderDetails.sellers
    vbaseOrderDetails[newOrderId[1]].invoiceNumber =
      orderDetails?.packageAttachment?.packages[0]?.invoiceNumber
    vbaseOrderDetails[newOrderId[1]].preorderInfo = preorderPayment
    vbaseOrderDetails['shippingData'] = shippingData
    vbaseOrderDetails['orderId'] = orderDetails.orderId.split('-')[0]
    vbaseOrderDetails['newInvoiceData'] = invoiceData

    saveToVbaseResponse = await saveVbaseData(
      newOrderId[0],
      vbaseOrderDetails,
      ctx
    )
  } else {
    let saveObj: any = {}
    let items = []
    for (const item of orderDetails.items) {
      if (isPreorder) {
        const { depositPayment, balancePayment, balanceDue } =
          await extractPreOrderInfo(preOrderDetails, item)
        preorderPayment.depositPayment =
          preorderPayment.depositPayment + depositPayment
        preorderPayment.balancePayment =
          preorderPayment.balancePayment + balancePayment
        preorderPayment.balanceDue = preorderPayment.balanceDue + balanceDue
      }
      items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        priceDefinition: item.priceDefinition,
        unitPrice: item.sellingPrice,
        orderCommission: item.commission,
        refId: item.refId,
        tax: item.tax,
        description: await getSKUSpecifications(item.id, account, authToken),
      })
    }

    console.log({ items })
    if (preorderPayment.depositPayment !== 0) {
      preorderPayment.depositPayment =
        preorderPayment.depositPayment + priceWithShipment
    } else {
      preorderPayment.balancePayment =
        preorderPayment.balancePayment + priceWithShipment
    }

    saveObj[newOrderId[1]] = { items: items }
    saveObj[newOrderId[1]].invoiceNumber =
      orderDetails?.packageAttachment?.packages[0]?.invoiceNumber
    saveObj[newOrderId[1]].totals = orderDetails.totals
    saveObj[newOrderId[1]].grandTotal = orderDetails.value
    saveObj[newOrderId[1]].sellers = orderDetails.sellers
    saveObj[newOrderId[1]].preorderInfo = preorderPayment
    saveObj['shippingData'] = shippingData
    saveObj['newInvoiceData'] = invoiceData
    saveObj['orderId'] = orderDetails.orderId.split('-')[0]

    console.log('Order Id save-->', newOrderId[0])
    console.log({ saveObj })
    saveToVbaseResponse = await saveVbaseData(newOrderId[0], saveObj, ctx)
  }
  const vbaseOrderDetails1: any = await getVbaseData(ctx, newOrderId[0])

  console.log('Data Responses - VBase : ', {
    saveToVbaseResponse,
    newOrderId,
    orderDetails,
    vbaseOrderDetails,
    vbaseOrderDetails1,
  })

  orderDetails.noOfOrdersInvoiced =
    (vbaseOrderDetails &&
      Object.keys(vbaseOrderDetails).filter((res: any) => {
        if (!isNaN(res)) return res
      }).length) ??
    0

  orderDetails.noOfSellers = orderDetails.itemMetadata.Items.map(
    (item: any, index: number, items: any) => {
      return (
        index == items.findIndex((value: any) => value.Seller === item.Seller)
      )
    }
  ).length
  return orderDetails
}

export async function notifyBuyer(
  orderId: any,
  useremail: string,
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
    'BUYER ******* the order id is : ' +
      orderId +
      ' the account is : ' +
      account,
    workspace +
      ' cc and email is - ' +
      customFields.marketplace_email +
      useremail
  )
  console.log(
    'buyer invoice - ',
    `https://${workspace}--${account}.myvtex.com/invoice/buyer/${orderId}/${invoiceNo}`
  )

  const payload = {
    TemplateName: 'order-confirmed',
    applicationName: 'email',
    logEvidence: true,
    jsonData: {
      cc: customFields.marketplace_email,
      email: useremail,
      invoiceUrl: `https://${workspace}--${account}.myvtex.com/invoice/buyer/${orderId}/${invoiceNo}`,
      message: 'This is a test',
    },
  }
  const emailRes = await email.notify(account, payload)
  console.log('Buyer RESPONSE FROM EMAIL REQUEST  - ', { emailRes })

  return emailRes
}
