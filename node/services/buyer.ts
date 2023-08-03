import {
  checkIfAllItemsAreInvoiced,
  extractPreOrderInfo,
  filterRecentlyInvoicedItem,
  findEachItemPreOrder,
} from '../middlewares/preorder'
import {
  getProductSpecifications,
  getSKUSpecifications,
} from '../middlewares/specifications'
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
    isPreOrder: false,
  }
  let priceWithShipment =
    orderDetails.totals.filter((res: any) => res.id === 'Shipping')[0].value /
    100

  let allItems
  let shippingCost
  const invoiceDetails: any = !vbaseOrderDetails
    ? orderDetails.packageAttachment.packages[0]
    : await filterRecentlyInvoicedItem(
        orderDetails.packageAttachment.packages,
        vbaseOrderDetails,
        newOrderId[1]
      )

  console.log('Invoiced item Details - ', invoiceDetails)

  //calculating shipping cost for the order
  orderDetails.totals.forEach((totals: any) => {
    if (totals.id === 'Shipping') shippingCost = totals.value / 100
  })

  if (vbaseOrderDetails != null) {
    let changeobj = []
    for (const item of invoiceDetails.items) {
      // if (!isPreorder) {
      allItems = orderDetails.items[item.itemIndex]
      item.tax = allItems.tax
      item.id = allItems.id
      item.name = allItems.name
      item.priceDefinition = allItems.priceDefinition
      item.unitPrice = allItems.sellingPrice
      item.orderCommission = allItems.commission
      item.refId = allItems.refId
      item.sellingPrice = allItems.sellingPrice
      item.productId = allItems.productId
      // }
      // if (isPreorder) {
      const { depositPayment, balancePayment, balanceDue, isPreOrder } =
        await extractPreOrderInfo(preOrderDetails, item)
      preorderPayment.depositPayment =
        preorderPayment.depositPayment + depositPayment
      preorderPayment.balancePayment =
        preorderPayment.balancePayment + balancePayment
      preorderPayment.balanceDue = preorderPayment.balanceDue + balanceDue
      preorderPayment.isPreOrder = isPreOrder
      // }
      item.isPreOrder = preorderPayment.isPreOrder

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
        wholeSalePrice: await getProductSpecifications(
          item.productId,
          account,
          authToken
        ),
        isPreOrder: item.isPreOrder,
      })
    }

    const allItemInvoiced = await checkIfAllItemsAreInvoiced(
      orderDetails.packageAttachment.packages,
      orderDetails.items
    )
    console.log('All Items are invoiced', allItemInvoiced)
    if (preorderPayment.depositPayment !== 0) {
      preorderPayment.depositPayment = allItemInvoiced
        ? preorderPayment.depositPayment + priceWithShipment
        : preorderPayment.depositPayment
    } else {
      preorderPayment.balancePayment = allItemInvoiced
        ? preorderPayment.balancePayment + priceWithShipment
        : preorderPayment.balancePayment
    }

    vbaseOrderDetails[newOrderId[1]] = !vbaseOrderDetails[newOrderId[1]]
      ? {}
      : vbaseOrderDetails[newOrderId[1]]
    vbaseOrderDetails[newOrderId[1]][invoiceDetails.invoiceNumber] = {
      items: changeobj,
      invoiceNumber: invoiceDetails.invoiceNumber,
      preorderInfo: preorderPayment,
      shippingCharge: allItemInvoiced ? shippingCost : 0,
    }
    console.log(
      'Vbase details after saving the invoie details',
      vbaseOrderDetails
    )
    console.log(
      'vbase if total are there - ',
      vbaseOrderDetails[newOrderId[1]]?.totals
    )

    if (!vbaseOrderDetails[newOrderId[1]]?.totals) {
      vbaseOrderDetails[newOrderId[1]].totals = orderDetails.totals
      vbaseOrderDetails[newOrderId[1]].grandTotal = orderDetails.value
      vbaseOrderDetails[newOrderId[1]].sellers = orderDetails.sellers
      vbaseOrderDetails['shippingData'] = shippingData
      vbaseOrderDetails['orderId'] = orderDetails.orderId.split('-')[0]
      vbaseOrderDetails['newInvoiceData'] = invoiceData
    }
    vbaseOrderDetails[newOrderId[1]].allItemInvoiced = allItemInvoiced
    console.log('Vbase details after saving the all details', vbaseOrderDetails)

    saveToVbaseResponse = await saveVbaseData(
      newOrderId[0],
      vbaseOrderDetails,
      ctx
    )
  } else {
    let saveObj: any = {}
    let items = []
    for (const item of invoiceDetails.items) {
      allItems = orderDetails.items[item.itemIndex]
      item.tax = allItems.tax
      item.id = allItems.id
      item.name = allItems.name
      item.priceDefinition = allItems.priceDefinition
      item.unitPrice = allItems.sellingPrice
      item.orderCommission = allItems.commission
      item.refId = allItems.refId
      item.sellingPrice = allItems.sellingPrice
      item.productId = allItems.productId

      const { depositPayment, balancePayment, balanceDue, isPreOrder } =
        await extractPreOrderInfo(preOrderDetails, item)
      preorderPayment.depositPayment =
        preorderPayment.depositPayment + depositPayment
      preorderPayment.balancePayment =
        preorderPayment.balancePayment + balancePayment
      preorderPayment.balanceDue = preorderPayment.balanceDue + balanceDue
      preorderPayment.isPreOrder = isPreOrder

      item.isPreOrder = preorderPayment.isPreOrder

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
        wholeSalePrice: await getProductSpecifications(
          item.productId,
          account,
          authToken
        ),
        isPreOrder: item.isPreOrder,
      })
    }
    const allItemInvoiced = await checkIfAllItemsAreInvoiced(
      orderDetails.packageAttachment.packages,
      orderDetails.items
    )
    console.log({ items })
    if (preorderPayment.depositPayment !== 0) {
      preorderPayment.depositPayment = allItemInvoiced
        ? preorderPayment.depositPayment + priceWithShipment
        : preorderPayment.depositPayment
    } else {
      preorderPayment.balancePayment = allItemInvoiced
        ? preorderPayment.balancePayment + priceWithShipment
        : preorderPayment.balancePayment
    }
    saveObj[newOrderId[1]] = {
      [invoiceDetails.invoiceNumber]: {
        items: items,
        invoiceNumber: invoiceDetails.invoiceNumber,
        preorderInfo: preorderPayment,
        shippingCharge: allItemInvoiced ? shippingCost : 0,
      },
    }

    saveObj[newOrderId[1]].totals = orderDetails.totals
    saveObj[newOrderId[1]].grandTotal = orderDetails.value
    saveObj[newOrderId[1]].sellers = orderDetails.sellers
    saveObj[newOrderId[1]].allItemInvoiced = allItemInvoiced
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

  orderDetails.invoiceNumber = invoiceDetails.invoiceNumber
  orderDetails.allItemInvoiced = invoiceDetails.allItemInvoiced
  return orderDetails
}

export async function notifyBuyer(
  orderId: any,
  useremail: string,
  firstName: string,
  account: string,
  invoiceNo: string,
  customFields: any,
  workspace: any,
  ctx: any,
  brandName: string
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
      orderId: orderId,
      firstName: firstName,
      invoiceNumber: invoiceNo,
      cc: customFields.marketplace_email,
      email: useremail,
      invoiceUrl: `https://${workspace}--${account}.myvtex.com/invoice/buyer/${orderId}/${invoiceNo}`,
      message: '',
      brandName,
    },
  }
  const emailRes = await email.notify(account, payload)
  console.log('Buyer RESPONSE FROM EMAIL REQUEST  - ', { emailRes })

  return emailRes
}
