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
  const htmlItems = items.map((data, index) => {
    grand = data.grandTotal + grand

    data.totals?.map((totals) => {
      if (totals.id === 'Discounts') return (discount = totals.value + discount)
    })
    let a = 1
    return data?.items?.map((data2, index2) => {
      return (
        <tr>
          <td>{index + 1 + index2}</td>
          <td>{data2.name}</td>
          <td>{data2.quantity}</td>
          <td>{data2.priceDefinition.total / 100}</td>
        </tr>
      )
    })
  })
  return { htmlItems, grand, discount }
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
