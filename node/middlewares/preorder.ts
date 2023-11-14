import axios from 'axios'

export async function getPreOrderInfo(
  apiKey: string,
  orderId: string,
  authToken: string
) {
  console.log({ authToken })

  const headers = {
    Authorization: apiKey,
  }
  console.log('Headers preorder - ', headers)
  console.log('OrderId preorder - ', orderId)

  const result = await axios
    .get(
      `http://ec2-13-211-128-127.ap-southeast-2.compute.amazonaws.com/payment-intent/order?orderId=${orderId}`,
      {
        headers: {
          Authorization:
            'Basic d2hvbGFfdnRleF9tcDphM2EyNDgyOGQwYzgxNDg2Y2FlZjExOTRlMWQwZjMyMA==',
        },
      }
    )
    .then((res: any) => {
      return {
        isError: false,
        data: res.data,
      }
    })
    .catch((err: any) => {
      console.log('Pre order Error - ', err)
      return { isError: true, data: err.response.data }
    })

  return result
}

export async function extractPreOrderInfo(preOrder: any, item: any) {
  // let preorderInfo = []
  let preorderObj = {
    itemTax:0,
    depositPayment: 0,
    balancePayment: 0,
    balanceDue: 0,
    isPreOrder: false,
  }
  preorderObj.itemTax = preorderObj.itemTax + (item.tax/100)

  console.log('ITEM - SKU INFO - ', { item })
  if (
    preOrder?.paymentId &&
    preOrder?.products &&
    preOrder?.products.length > 0
  ) {
    console.log('PREORDER EXISTS', { preOrder })

    for (const preorderitem of preOrder.products) {
      const {
        remainingCharge,
        quantity,
        fullPrice,
        isProductPreorder,
        percent,
      } = preorderitem
      console.log({ remainingCharge, quantity, fullPrice })
      const totalWithoutShippingCharge =
        (item.sellingPrice / 100) * item.quantity + item.tax / 100
      if (item.id === preorderitem.skuId) {
        if (isProductPreorder) {
          preorderObj.isPreOrder = preorderitem.isProductPreorder
          preorderObj.balancePayment =
            preorderObj.balancePayment +
            // totalWithoutShippingCharge -
            (remainingCharge === 0 ? totalWithoutShippingCharge : totalWithoutShippingCharge * (percent / 100))

          preorderObj.depositPayment =
            preorderObj.depositPayment +
            totalWithoutShippingCharge * (percent / 100)

          preorderObj.balanceDue =
            preorderObj.balanceDue + (remainingCharge === 0 ? 0 :
            (totalWithoutShippingCharge - totalWithoutShippingCharge*(percent/100)))
        } else {
          preorderObj.balancePayment = preorderObj.balancePayment + totalWithoutShippingCharge
        }
      }
    }
  }
  console.log('PREORDER INFO OBJ - ', { preorderObj })

  return preorderObj
}

export async function preorderPaymentDetails(preOrderDetails: any, item: any) {
  let preorderinv = { depositPayment: 0, balancePayment: 0, balanceDue: 0 }
  const { depositPayment, balancePayment, balanceDue } =
    await extractPreOrderInfo(preOrderDetails, item)
  preorderinv.depositPayment = preorderinv.depositPayment + depositPayment
  preorderinv.balancePayment = preorderinv.balancePayment + balancePayment
  preorderinv.balanceDue = preorderinv.balanceDue + balanceDue
  return preorderinv
}

export async function findEachItemPreOrder(
  products: any,
  items: any[],
  isEachItemPreOrder: boolean
) {
  let value = true

  for (const item of items) {
    console.log('Items  here -', item.id)
    for (const product of products) {
      if (item.id === product.skuId) {
        value = isEachItemPreOrder
          ? product.isProductPreorder
          : !product.isProductPreorder
        break
      }
    }
    if (!value) break
  }
  console.log(
    'isEachItemPreOrder - ' + isEachItemPreOrder + ' result - ',
    value
  )
  return value
}

export async function filterRecentlyInvoicedItem(
  invoicedItems: any[],
  savedItems: any,
  groupId: string
) {
  let itemsToInvoice: any = []
  let invoiceNumber = ''
  for (let packages of invoicedItems) {
    console.log('Each Package of Invoiced Item - ', { packages })
    invoiceNumber = packages.invoiceNumber
    if (savedItems[groupId] && !savedItems[groupId][invoiceNumber]) {
      itemsToInvoice = packages
      break
    } else if (!savedItems[groupId]) {
      itemsToInvoice = packages
      break
    }
  }
  return itemsToInvoice
}

export async function checkIfAllItemsAreInvoiced(
  packages: any[],
  items: any[]
) {
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const noItemsInvoiced = packages.reduce(
    (total, packages) =>
      total +
      packages.items.reduce(
        (itotal: number, item: any) => itotal + item.quantity,
        0
      ),
    0
  )
  console.log(
    'totalItems - ' + totalItems + ' noItemsInvoiced - ' + noItemsInvoiced
  )
  return totalItems === noItemsInvoiced
}
