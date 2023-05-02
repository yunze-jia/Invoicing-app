import { constants } from '../../node/utils/constant'
import axios from 'axios'

const styles = require('../index.css')
import React, { useEffect, useState } from 'react'
import {
  getOrderDetails,
  getNewBuyerOrderDetails,
  getBuyerDecEmail,
} from '../services/order'

export const getLogo = (setLogo) => {
  const tempLogo = Array.from(
    document.getElementsByClassName(
      'vtex-store-components-3-x-logoImage vtex-render-runtime-8-x-lazyload lazyloaded'
    )
  )
  // const finalLogo=tempLogo?.map((data)=>data.src)
  // console.log(finalLogo);
  setLogo(tempLogo)
}

export const BuyerTemplate = ({ body }) => {
  const [test, setTest] = useState(false)
  console.log(body)
  const orderId = body.params ? body.params.order_id : null
  let invoiceUrl = body.params ? body.params.invoice_url : null
  const type = body.params ? body.params.type : null
  const sellerId = body.params ? body.params.sellerId : null
  // const orderDetails =  await getOrderDetails(orderId,"vtexasia")
  const [order, setOrder] = useState([])
  const [email, setEmail] = useState([])
  const [logo, setLogo] = useState([])
  useEffect(() => {
    // async function setOrderDetails() {
    //     if (orderId) {
    //         setOrder(await getOrderDetails(orderId, invoiceUrl, type, sellerId));
    //     }
    // }

    setOrderDetails()
    setInterval(getLogo(setLogo, logo), 2000)
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

  console.log('NewLogo=========>', logo)

  const downloadPdf = () => {
    try {
      // Print for Safari browser
      document.execCommand('print', false, null)
    } catch {
      window.print()
    }
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
        <button id='printPageButton'  className={styles.printButton} onClick={downloadPdf}>
          print
        </button>
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
            total = (subTotal / 100 - discount / 100 + price / 100).toFixed(2)
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
                      >{`${order.vbase?.newInvoiceData?.status}`}</p>
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
                       <p>{`${newOrder?.sellers?.map((seller)=>seller.name)}`}</p>
                       {/* <p>{`${order?.data?.sellers?.map((data)=>(data?.name))}`}</p> */}
                       {/* <p>{`${order.vbase.newInvoiceData?.soldBy}`}</p> */}
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
                <div
                  style={{
                    width: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  {/* <div style={{ height: '20%' }}>
                    <b
                      className={styles.orderStyle}
                    >{`${order?.vbase?.newInvoiceData?.name}`}</b>
                  </div> */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                    }}
                  >
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
                      <th style={{ textAlign: 'left' }}>Description</th>
                      <th style={{ textAlign: 'center' }}>Reference</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'center' }}>Unit price</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
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
                          <td style={{ textAlign: 'left' }}>{item.name}</td>
                          <td style={{ textAlign: 'center' }}>{item.refId}</td>
                          <td style={{ textAlign: 'center' }}>
                            {item.quantity}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.unitPrice / 100}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {item.priceDefinition.total / 100}
                          </td>
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
                <div className={styles.totalStyle}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <p style={{ color: '#979899' }}>Subtotal</p>
                    <p style={{ color: '#979899' }}>{`${subTotal / 100}`}</p>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <p style={{ color: '#979899' }}>Discount : </p>
                    <p style={{ color: '#979899' }}>{`${discount / 100}`}</p>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <p style={{ color: '#979899' }}>Shipping</p>
                    <p style={{ color: '#979899' }}>
                      {`${(
                        order.vbase?.shippingData?.logisticsInfo[0].price / 100
                      ).toFixed(2)}`}
                    </p>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <p>Total (incl. VAT) : </p>
                    <p>{`${calculateGrandTotal(
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
        <div className={styles.grandTotalStyle}
          // style={{
          //   display: 'flex',
          //   fontWeight: 1000,
          //   justifyContent: 'space-between',
          //   width: '24%',
          // }}
        >
          <p>Grand Total</p>
          <p>{`${grandTotals.toFixed(2)}`}</p>
        </div>
      </div>
    </div>
  )
}
