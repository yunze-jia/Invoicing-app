import { constants } from '../../node/utils/constant'
import axios from 'axios'

const styles = require('../index.css')
import React, { useEffect, useState } from 'react'
import {
  getOrderDetails,
  getNewBuyerOrderDetails,
  getBuyerDecEmail,
} from '../services/order'

export const BuyerTemplate = ({ body }) => {
  console.log(body)
  const orderId = body.params ? body.params.order_id : null
  const invoiceUrl = body.params ? body.params.invoice_url : null
  const type = body.params ? body.params.type : null
  const sellerId = body.params ? body.params.sellerId : null
  // const orderDetails =  await getOrderDetails(orderId,"vtexasia")
  const [order, setOrder] = useState([])
  const [email, setEmail] = useState([])
  useEffect(() => {
    // async function setOrderDetails() {
    //     if (orderId) {
    //         setOrder(await getOrderDetails(orderId, invoiceUrl, type, sellerId));
    //     }
    // }

    setOrderDetails()
  }, [])
  async function setOrderDetails() {
    if (orderId) {
      setOrder(
        await getNewBuyerOrderDetails(orderId, invoiceUrl, type, sellerId)
      )
      setEmail(await getBuyerDecEmail(orderId))
    }
  }

  console.log(email)

  const downloadPdf = () => {
    window.print()
  }
  console.log(order)
  let vbaseKey = []
  if (order?.vbase) {
    vbaseKey = Object.keys(order.vbase).filter((i) => {
      if (!isNaN(i)) {
        return i
      }
    })
  }
  let total = 0
  let subTotal = null
  let placedDate = null
  let issueDate = null
  let discount = null
  let grandTotals = 0
  return (
    <div style={{ width: '70%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div />
        <button className={styles.printButton}>print</button>
      </div>
      {order?.vbase &&
        vbaseKey.map((data, index) => {
          const isLast = vbaseKey.length === index + 1
          const newOrder = order.vbase[data]
          //Taking out Discount
          newOrder?.totals.map((totals, index) => {
            if (totals.id === 'Discounts')
              return (discount = totals.value + (index === 2 ? discount : 0))
          })

          let newDisount = discount.toString()
          discount = newDisount.replace('-', '')

          //placed date calculation
          const newDate = new Date(order.vbase.newInvoiceData?.creationDate)
          const stringDate = newDate.toString()
          placedDate = stringDate.split(' ')

          //issued date calculation
          const issueNewDate = new Date(
            order?.vbase?.newInvoiceData?.lastChange
          )
          const issuedStringDate = issueNewDate.toString()
          issueDate = issuedStringDate.split(' ')

          const calculateGrandTotal = (subTotal, discount, price) => {
            total = (subTotal / 100 - discount / 100 + price / 10).toFixed(2)
            grandTotals = Number(total) + grandTotals
            return total
          }

          return (
            <div
              style={{
                borderBottom: isLast
                  ? 'solid 0px #E3E4E6'
                  : 'solid 1px #E3E4E6',
              }}
            >
              <div style={{ width: '100%', display: 'flex', marginTop: '2%' }}>
                <div style={{ width: '50%' }}>
                  <div>
                    <b
                      className={styles.orderStyle}
                    >{`Order ${order.vbase.orderId}-${data}`}</b>
                  </div>
                  <div className={styles.statusFontOuter}>
                    <div className={styles.fontInner}>
                      <p style={{ color: '#979899' }}>status</p>
                    </div>
                    <div>
                      <p
                        className={styles.status}
                      >{`${order.vbase.newInvoiceData?.status}`}</p>
                    </div>
                  </div>
                  <div className={styles.fontOuter}>
                    <div className={styles.fontInner}>
                      <p>Placed on</p>
                    </div>
                    <div>
                      <p>{`${placedDate[2]} ${placedDate[1]} ${placedDate[3]} at ${placedDate[4]}`}</p>
                    </div>
                  </div>
                  <div className={styles.fontOuter}>
                    <div className={styles.fontInner}>
                      <p>Sold by</p>
                    </div>
                    <div>
                      <p>{`${order.vbase.newInvoiceData?.soldBy}`}</p>
                    </div>
                  </div>
                  <div className={styles.fontOuter}>
                    <div className={styles.fontInner}>
                      <p>Invoice ID</p>
                    </div>
                    <div>
                      <p>{`${order?.invoiceNumber}`}</p>
                    </div>
                  </div>
                  <div className={styles.fontOuter}>
                    <div className={styles.fontInner}>
                      <p>Issued on</p>
                    </div>
                    <div>
                      <p>{`${issueDate[2]} ${issueDate[1]} ${issueDate[3]} at ${issueDate[4]}`}</p>
                    </div>
                  </div>
                </div>
                <div style={{ width: '50%' }}>
                  <div style={{ height: '20%' }}>
                    <b
                      className={styles.orderStyle}
                    >{`${order.vbase.newInvoiceData.name}`}</b>
                  </div>
                  <div>
                    <div>
                      <a href="#0">{`${email?.email}`}</a>
                    </div>
                    <div className={styles.fontOuter}>
                      <p>{`${order?.vbase?.shippingData?.address?.street},${order?.vbase?.shippingData?.address?.city},${order?.vbase?.shippingData?.address?.country},${order?.vbase?.shippingData?.address?.postalCode}`}</p>
                    </div>
                    <div className={styles.fontOuter}>
                      <p>{`Standard delivery Up to ${order?.vbase?.shippingData?.logisticsInfo[0]?.shippingEstimate.replace(
                        'bd',
                        ' business days'
                      )}`}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Reference</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody className={styles.aligntablecenter}>
                    {newOrder?.items.map((item, index) => {
                      // calculating subTotal
                      subTotal =
                        item?.priceDefinition?.total + (index ? subTotal : 0)

                      // total=(subTotal-discount+((order.vbase.shippingData.logisticsInfo[0].price)/10))
                      return (
                        <tr>
                          <td>{item.name}</td>
                          <td>{item.refId}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unitPrice / 100}</td>
                          <td>{item.priceDefinition.total / 100}</td>
                        </tr>
                      )
                    })}
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
                <div style={{ width: '30%' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <p style={{ color: '#979899' }}>Subtotal</p>
                    <p style={{ paddingRight: '20%', color: '#979899' }}>
                      {`${subTotal / 100}`}
                    </p>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <p style={{ color: '#979899' }}>Discount : </p>
                    <p style={{ paddingRight: '20%', color: '#979899' }}>
                      {`${discount / 100}`}
                    </p>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <p style={{ color: '#979899' }}>Shipping</p>
                    <p style={{ paddingRight: '20%', color: '#979899' }}>
                      {`${
                        order.vbase.shippingData.logisticsInfo[0].price / 10
                      }`}
                    </p>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <p>Total (incl. VAT) : </p>
                    <p style={{ paddingRight: '20%' }}>{`${calculateGrandTotal(
                      subTotal,
                      discount,
                      order?.data?.shippingData?.logisticsInfo[0]?.price
                    )}`}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
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
