import { constants } from '../../node/utils/constant'
import axios from 'axios'
import React from 'react'

export const getOrderDetails = async (orderId, invoiceUrl, type, sellerId) => {
  const options = {
    method: 'POST',
    url: `/_v/order/${orderId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VTEX-API-AppKey': constants.APP_KEY,
      'X-VTEX-API-AppToken': constants.APP_TOKEN,
    },
  }

  const orderDetails = await axios
    .request(options)
    .then(function (response) {
      console.log(response.data)
      return response.data
    })
    .catch(function (error) {
      console.log(error)
    })
  // let invoiceNumber = await generateInvoiceNumber(orderDetails.orderId);
  orderDetails.invoiceNumber = invoiceUrl
  //  = orderDetails.items
  const seller =
    type === 'seller'
      ? orderDetails.items.filter((res) => {
          if (res.seller === sellerId) return res
        })
      : orderDetails.items

  if (type != 'seller') {
    let items = await createTableProducts(seller)
    orderDetails.htmlItems = items
  } else {
    orderDetails.htmlItems = orderDetails.items
  }
  return orderDetails
}

const createTableProducts = async (items) => {
  let grand = null
  let discount = null
  let total = null
  const htmlItems = items.map((data) => {
    grand = data.grandTotal + grand

    data.totals?.map((totals) => {
      if (totals.id === 'Discounts') return (discount = totals.value + discount)
    })

    return data?.items?.map((data2) => {
      return (
        (total = data2.priceDefinition.total + total),
        (
          <tr>
            <td>{data2.name}</td>
            <td>{data2.refId}</td>
            <td>{data2.quantity}</td>
            <td>{`S$ ${data2.unitPrice / 100}`}</td>
            <td>{`S$ ${data2.priceDefinition.total / 100}`}</td>
          </tr>
        )
      )
    })
  })
  return { htmlItems, grand, discount, total }
}

export const getNewBuyerOrderDetails = async (
  orderId,
  invoiceUrl,
  type,
  sellerId
) => {
  const options = {
    method: 'GET',
    url: `/_v/orders/buyerxa/${orderId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VTEX-API-AppKey': constants.APP_KEY,
      'X-VTEX-API-AppToken': constants.APP_TOKEN,
    },
  }
  const orderDetails = await axios
    .request(options)
    .then(function (response) {
      return response.data
    })
    .catch(function (error) {
      return error
    })

  orderDetails.invoiceNumber = invoiceUrl
  const buyer = orderDetails.vbase
  let seller = []
  Object.keys(orderDetails.vbase).map((key) => {
    if (!isNaN(parseInt(key))) {
      seller.push(orderDetails.vbase[key])
    }
  })
  seller = seller.flat(2)

  console.log(seller)

  console.log('final api call=====================>', orderDetails, seller)
  let items = await createTableProducts(seller)
  orderDetails.htmlItems = items
  return orderDetails
}
export const getSellerInfo = async (sellerId) => {
  const options = {
    method: 'POST',
    url: `/_v/orders/seller/${sellerId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VTEX-API-AppKey': constants.APP_KEY,
      'X-VTEX-API-AppToken': constants.APP_TOKEN,
    },
  }

  const email = await axios.request(options)
  if (email) {
    return email.data
  } else {
    return 'something went wrong in getSellerInfo'
  }
}
export const getBuyerDecEmail = async (orderId) => {
  const options = {
    method: 'GET',
    url: `/_v/orders/buyerEncrptEmails/${orderId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VTEX-API-AppKey': constants.APP_KEY,
      'X-VTEX-API-AppToken': constants.APP_TOKEN,
    },
  }

  debugger

  const decrEmail = await axios.request(options)
  console.debug(decrEmail)
  if (decrEmail) {
    debugger
    return decrEmail.data
  } else {
    debugger
    return 'something went wrong in getBuyerDecEmail'
  }
}
