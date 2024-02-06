import axios from 'axios'
import React from 'react'

export const getOrderDetails = async (orderId) => {
  const options = {
    method: 'POST',
    url: `/_v/order/${orderId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }

  let orderDetails = await axios
    .request(options)
    .then(function (response) {
      return response.data
    })
    .catch(function (error) {
      console.log('Error while fetching the Order Details - ',error)
    })
  return orderDetails
}

const createTableProducts = async (items) => {
  let grand = null
  let discount = null
  let total = null
  const htmlItems = items.map((data) => {
    grand = data.grandTotal + grand
    debugger
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
  debugger
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
    url: `/_v/orders/buyer/${orderId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
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
  if (buyer) {
    Object.keys(orderDetails.vbase).map((key) => {
      if (!isNaN(parseInt(key))) {
        seller.push(orderDetails.vbase[key])
      }
    })
  }
  seller = seller.flat(2)
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
    },
  }

  const email = await axios.request(options)
  debugger
  if (email) {
    return email.data
  } else {
    return 'something went wrong in getSellerInfo'
  }
}
