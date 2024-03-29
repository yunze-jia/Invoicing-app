import React, { useEffect, useState } from 'react'
import { getOrderDetails, getSellerInfo } from '../services/order'
import { getLogo } from './buyer'

const styles = require('../index.css')

export const SellerTemplate = ({ body }) => {
  const orderId = body.params ? body.params.order_id : null
  const invoiceUrl = body.params ? body.params.invoice_url : null
  const type = body.params ? body.params.type : null
  const sellerId = body.params ? body.params.seller_id : null
  // const orderDetails =  await getOrderDetails(orderId,"vtexasia")
  const [order, setOrder] = useState([])
  const [sellerInfo, setSellerInfo] = useState([])
  const [logo, setLogo] = useState([])
  async function setOrderDetails() {
    if (orderId) {
      const temp = await getOrderDetails(orderId, invoiceUrl, type, sellerId)
      setOrder(temp)
      const sellerIds = temp?.items?.find((data) => data).seller
      setSellerInfo(await getSellerInfo(sellerIds))
    }
  }
  console.log(sellerInfo)
  useEffect(() => {
    setOrderDetails()
    setInterval(getLogo(setLogo, logo), 2000)
  }, [])

  console.log(order)
  const downloadPdf = () => {
    try {
      // Print for Safari browser
      document.execCommand('print', false, null)
    } catch {
      window.print()
    }
  }

  const getPlacedDate = (placed) => {
    if (placed) {
      //placed date calculation
      const newDate = new Date(placed)
      const stringDate = newDate.toString()
      const placedDate = stringDate.split(' ')
      return `${placedDate[2]} ${placedDate[1]} ${placedDate[3]} at ${placedDate[4]}`
    } else {
      return ''
    }
  }
  let total = 0
  let subTotal = null
  let placedDate = null
  let issueDate = null
  let discount = null
  let grandTotals = 0

  const calculateGrandTotal = (subTotal, discount, price) => {
    //calculating Grand Total
    total = (subTotal / 100 + discount / 100 + price / 100).toFixed(2)
    grandTotals = Number(total) + grandTotals
    return total
  }
  const CalculateDiscount = (order) => {
    //calculating Discount
    return (
      -order?.totals?.filter((totals, index) => {
        if (totals.id === 'Discounts')
          return (discount = totals.value + (index === 2 ? discount : 0)) / 100
      })[0].value / 100
    )
  }

  const calculateShippingCharge = (order) => {
    const newShipingCharge = order?.totals?.find(
      (shipping) => shipping.id === 'Shipping'
    ).value
    return (newShipingCharge / 100).toFixed(2)
  }

  return (
    <div className={styles.aaa}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6%',
        }}
      >
        <div>
          <img
            href="/"
            src={
              logo.length != 0
                ? logo[0]
                : 'https://brand.vtex.com/wp-content/themes/vtex-brand/img/logo.svg'
            }
          />
        </div>
        <button className={styles.printButton} onClick={downloadPdf}>
          print
        </button>
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          marginTop: '2%',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ width: '50%' }}>
          <div>
            <b className={styles.orderStyle}>{`Order ${order?.orderId}`}</b>
          </div>
          <div className={styles.statusFontOuter}>
            {/* <div className={styles.fontInner}>
              <p style={{ color: '#979899' }}>status</p>
            </div>
            <div>
              <p className={styles.status}>{`${order?.status}`}</p>
            </div> */}
          </div>
          <div className={styles.fontOuter}>
            {/* <div className={styles.fontInner}>
              <p>Placed on</p>
            </div>
            <div>
              <p>{getPlacedDate(order?.creationDate)}</p>
            </div> */}
          </div>
          <div className={styles.fontOuter}>
            <div className={styles.fontInner}>
              <p>Sold to</p>
            </div>
            <div>
              <p>{`${
                order?.clientProfileData?.firstName +
                ' ' +
                order?.clientProfileData?.lastName
              }`}</p>
            </div>
          </div>
          <div className={styles.fontOuter}>
            <div className={styles.fontInner}>
              <p>Invoice ID</p>
            </div>
            <div>
              <p>{`${order.invoiceNumber}`}</p>
            </div>
          </div>
          <div className={styles.fontOuter}>
            <div className={styles.fontInner}>
              <p>Issued on</p>
            </div>
            <div>
              <p>{getPlacedDate(order?.lastChange)}</p>
            </div>
          </div>
        </div>
        <div
          style={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ height: '20%' }}>
            <b className={styles.orderStyle}>
              {`${order?.sellers?.map((data) => data.name)}`}
            </b>
          </div>
          <div>
            <div>
              <a href="#0">{`${sellerInfo.map((data) => data.email)}`}</a>
            </div>
          </div>
        </div>
      </div>
      <div>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Description</th>
              <th style={{ textAlign: 'center' }}>Reference</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'center' }}>Unit price</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody className={styles.aligntablecenter}>
            {
              //Showing the data in the seller's invoice table
              order?.htmlItems?.map((data, index) => {
                subTotal = data?.priceDefinition?.total + (index ? subTotal : 0)
                return (
                  <tr>
                    <td style={{ textAlign: 'left' }}>{data.name}</td>
                    <td style={{ textAlign: 'center' }}>{data.refId}</td>
                    <td style={{ textAlign: 'center' }}>{data.quantity}</td>
                    <td style={{ textAlign: 'center' }}>
                      {data.sellingPrice / 100}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {data.priceDefinition.total / 100}
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          fontWeight: 700,
        }}
      >
        <div className={styles.totalStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ color: '#979899' }}>Subtotal</p>
            <p style={{ color: '#979899' }}>{`  ${subTotal / 100}`}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ color: '#979899' }}>Discount : </p>
            <p style={{ color: '#979899' }}>
              {`  ${CalculateDiscount(order)}`}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ color: '#979899' }}>Shipping</p>
            <p style={{ color: '#979899' }}>
              {`${calculateShippingCharge(order)}`}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p>Total (incl. VAT) : </p>
            <p>
              {`${calculateGrandTotal(
                subTotal,
                discount,
                order?.shippingData?.logisticsInfo[0]?.price
              )}`}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ color: '#979899' }}>Shipping comission </p>
            <p style={{ color: '#979899' }}>
              {/* {`  ${
                        order.vbase.shippingData.logisticsInfo[0].price / 10
                      }`} */}
            </p>
          </div>
          <div  style={{ display: order?.items?.map((data) => (data.commission !== 0 ? 'flex':'none' ))  , justifyContent: 'space-between' }}>
            <p style={{ color: '#979899' }}>Order comission </p>
            <p style={{ color: '#979899' }}>
              {`  ${order?.items?.map((data) => (data.commission/100).toFixed(2))}`}
            </p>
          </div>
        </div>
      </div>
      <hr style={{ color: '#E3E4E6' }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'end',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontWeight: 1000,
            justifyContent: 'space-between',
            paddingRight: '5%',
            width: '27%',
          }}
        >
          <p>Grand Total</p>
           <p>{`${grandTotals}`}</p>
        </div>
      </div>
    </div>
  )
}
