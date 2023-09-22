/* eslint-disable react/jsx-key */
import React, { useEffect, useState } from 'react'
import { getBuyerDecEmail, getNewBuyerOrderDetails } from '../services/order'
const styles = require('../index.css')

export const getLogo = (setLogo) => {
  const tempLogo = Array.from(
    document.getElementsByClassName(
      'vtex-store-components-3-x-logoImage vtex-render-runtime-8-x-lazyload lazyloaded'
    )
  )
  setLogo(tempLogo)
}

export const BuyerTemplate = ({ body }) => {
  const [test, setTest] = useState(false)
  const orderId = body.params ? body.params.order_id : null
  const groupId = orderId.split('-')[1]
  let invoiceUrl = body.params ? body.params.invoice_url : null
  const type = body.params ? body.params.type : null
  const sellerId = body.params ? body.params.sellerId : null
  const [order, setOrder] = useState([])
  const [email, setEmail] = useState([])
  const [logo, setLogo] = useState([])
  useEffect(() => {
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

  const downloadPdf = () => {
    try {
      // Print for Safari browser
      document.execCommand('print', false, null)
    } catch {
      window.print()
    }
  }

  let vbaseKey = []
  if (order?.vbase) {
    vbaseKey = Object.keys(order.vbase).filter((i) => {
      if (!isNaN(i)) {
        return i
      }
    })
  }
  let orderSuffix
  let total = 0
  let placedDate = null
  let subTotal = 0
  let tax = 0
  let totalTax = 0
  let issueDate = null
  let discount = null
  let grandTotals = 0
  return (
    <div className={styles.aaa}>
      <div
        style={{
          // display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6%',
        }}
      >
        <div className={styles.printmargin}>
          <button
            id="printPageButton"
            className={styles.printButton}
            onClick={downloadPdf}
          >
            print
          </button>
        </div>
        <div>
          <img className={styles.logo} href="/" src={order.logo} />
        </div>
      </div>
      {order?.vbase &&
        vbaseKey
          .filter((key) => {
            if (key === groupId) {
              return true
            }
            return false
          })
          .map((data, index) => {
            const isLast = vbaseKey.length === index + 1
            const newOrder = order.vbase[data]
            orderSuffix = newOrder[invoiceUrl]
            let shippingCost = 0

            total = (newOrder?.grandTotal/100).toFixed(2)

            //Total tax
            totalTax = (newOrder?.totals.filter((res)=>{
              if(res.id === 'Tax'){
                return res
              }
            })[0]?.value)/100 

            //Taking out Discount
            newOrder?.totals.map((totals, index) => {
              if (totals.id === 'Discounts')
                return (discount = totals.value + (index === 2 ? discount : 0))
            })

            //Taking out Shipping
            if (newOrder.allItemInvoiced) {
              newOrder?.totals.map((totals, index) => {
                if (totals.id === 'Shipping')
                  return (shippingCost = shippingCost + totals.value / 100)
              })
            }

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

            // const calculateGrandTotal = (subTotal, discount, price) => {
            //   total = (subTotal / 100 - discount / 100 + price / 100).toFixed(2)
            //   grandTotals = Number(total) + grandTotals
            //   return total
            // }

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
                    marginBottom: '35px',
                    width: '89%',
                    display: 'flex',
                    marginTop: '2%',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ width: '50%' }}>
                    <div className={styles.taxinovicetext}>
                      <b>Tax Invoice</b>
                      {/* <b
                        className={styles.orderStyle}
                      >{`Order ${order.vbase.orderId}-${data}`}</b> */}
                    </div>
                    {/* <div>
                      <p>{`${newOrder?.sellers?.map(
                        (seller) => seller.name
                      )}`}</p>
                    </div> */}
                    <div>
                      <div>
                        <p>{order?.vbase?.shippingData?.address?.street}</p>
                      </div>
                      {/* <div>
                        <p
                          className={styles.status}
                        >{`${order.vbase?.newInvoiceData?.status}`}</p>
                      </div> */}
                    </div>
                    <div>
                      <div>
                        <p>{order?.vbase?.shippingData?.address?.city}</p>
                      </div>
                      {/* <div>
                        <p>{`${placedDate[2]} ${placedDate[1]} ${placedDate[3]} at ${placedDate[4]}`}</p>
                      </div> */}
                    </div>
                    <div>
                      <div>
                        <p>{order?.vbase?.shippingData?.address?.state}</p>
                      </div>
                    </div>
                    <div>
                      <div>
                        <p>{order?.vbase?.shippingData?.address?.postalCode}</p>
                      </div>
                      {/* <div> */}
                      {/* <p>{`${newOrder?.sellers?.map((seller)=>seller.name)}`}</p> */}
                      {/* <p>{`Whola Pvt Ltd`}</p> */}
                      {/* </div> */}
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
                    <div>
                      <div>
                        <div className={styles.invoiceinfo}>
                          <b>Invoice Date</b>
                        </div>
                        <div>
                          <div>{`${issueDate[2]} ${issueDate[1]} ${issueDate[3]} at ${issueDate[4]}`}</div>
                        </div>
                      </div>
                      <div>
                        <div className={styles.invoiceinfo}>
                          <b>Invoice Number</b>
                        </div>
                        <div>
                          {/* <p>{`${order?.invoiceNumber}`}</p> */}
                          <div>{`${orderSuffix?.invoiceNumber}`}</div>
                        </div>
                      </div>
                      <div>
                        <div className={styles.invoiceinfo}>
                          <b>Whola Pty Ltd</b>
                        </div>
                        <div>
                          <div>ABN 76 632 555</div>
                        </div>
                      </div>
                      <div>
                        <div className={styles.invoiceinfo}>
                          <b>Seller</b>
                        </div>
                        <div>
                          <div>{`${newOrder?.sellers?.map(
                            (seller) => seller.name
                          )}`}</div>
                        </div>
                      </div>

                      {/* <div>
                        <div className={styles.invoiceinfo}>
                          <b>Seller</b>
                        </div>
                        <div>
                          <p>{`${newOrder?.sellers?.map(
                            (seller) => seller.name
                          )}`}</p>
                        </div>
                      </div> */}
                      {/* <div>
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
                      </div> */}
                    </div>
                  </div>
                </div>
                <div className={styles.tablemargin}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}>SKU</th>
                        <th style={{ textAlign: 'center' }}>Description</th>
                        <th style={{ textAlign: 'center' }}>Preorder</th>
                        <th style={{ textAlign: 'center' }}>WS</th>
                        <th style={{ textAlign: 'center' }}>Unit price</th>
                        <th style={{ textAlign: 'center' }}>Quantity</th>
                        <th style={{ textAlign: 'center' }}>Tax</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody className={styles.aligntablecenter}>
                      {orderSuffix?.items.map((item, index) => {
                        // calculating subTotal
                        subTotal =
                          subTotal + (item.unitPrice / 100) * item.quantity

                        // tax = tax + ((subTotal/100) * (item.tax/100))
                        tax = tax + item.tax / 100

                        // total=(subTotal-discount+((order.vbase.shippingData.logisticsInfo[0].price)/10))
                        return (
                          <tr>
                            <td style={{ textAlign: 'center' }}>{item?.id}</td>
                            <td style={{ textAlign: 'center' }}>
                              {item.refId}
                              {/* {item?.description ?? '-'} */}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {item.isPreOrder ? 'YES' : 'NO' ?? ''}
                              {/* {item?.description ?? '-'} */}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {item?.wholeSalePrice ?? '-'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              ${item.unitPrice / 100}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {item.quantity}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              ${item.tax / 100}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              ${(item.unitPrice / 100) * item.quantity}
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
                  <div
                    className={styles.totalStyle}
                    style={{ minWidth: '300px' }}
                  >
                    <div
                      className={styles.spacing}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ color: '#979899' }}>Subtotal</div>
                      <div style={{ color: '#979899' }}>{`$${subTotal.toFixed(2)}`}</div>
                    </div>
                    <div
                      className={styles.spacing}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ color: '#979899' }}>Tax Incl Shipping tax : </div>
                      <div style={{ color: '#979899' }}>{`$${totalTax.toFixed(
                        2
                      )}`}</div>
                    </div>
                    <div
                      className={styles.spacing}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ color: '#979899' }}>
                        Shipping :{' '}
                      </div>
                      <div
                        style={{ color: '#979899' }}
                      >{`$${orderSuffix?.shippingCharge}`}</div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* <p style={{ color: '#979899' }}>Shipping</p>
                      <p style={{ color: '#979899' }}>
                        {`${(
                          order.vbase?.shippingData?.logisticsInfo[0].price /
                          100
                        ).toFixed(2)}`}
                      </p> */}
                    </div>
                    <div
                      className={styles.spacing}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>Total : </div>
                      <div>{`$${total}`}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      {/* <hr style={{ color: '#E3E4E6' }} /> */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'end',
        }}
      >
        <div
          style={{
            minWidth: '300px',
            marginTop: '30px',
          }}
        >
          <div
            className={styles.flex}
            style={{ justifyContent: 'space-between', marginBottom: '2px' }}
          >
            <b>Deposit Payment</b>
            {/* <p className={styles.leftmargin}>{`-`}</p> */}
            <div className={styles.leftmargin}>
              {'$' +
                (orderSuffix?.preorderInfo?.depositPayment.toFixed(2) ??
                  '0.00')}
            </div>
          </div>
          {orderSuffix?.preorderInfo?.depositPayment > 0 ? (
            <div className={styles.taxtextfont}>
              including taxes & shipping charges
            </div>
          ) : null}
          <div
            className={styles.flex}
            style={{ justifyContent: 'space-between', marginBottom: '2px' }}
          >
            <b>Balance Payment</b>
            {/* <p className={styles.leftmargin}>{`$${(subTotal / 100) + tax}`}</p> */}
            <div className={styles.leftmargin}>
              {'$' +
                (orderSuffix?.preorderInfo?.balancePayment.toFixed(2) ??
                  '0.00')}
            </div>
          </div>
          {<div className={styles.taxTextFont}>including taxes</div>}
          <div
            className={styles.flex}
            style={{ justifyContent: 'space-between' }}
          >
            <b>Balance Due</b>
            {/* <p className={styles.leftmargin}>{`$0.00`}</p> */}
            <div className={styles.leftmargin}>
              {'$' +
                (orderSuffix?.preorderInfo?.balanceDue.toFixed(2) ?? '0.00')}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.info}>
        <span className={styles.greeting}>Thanks for your order!</span>
        <span className={styles.textInfo}>
          ETAs are an estimate of arrival date
        </span>
        <span className={styles.textInfo}>
          Preorders are non-cancellable as all stock is made to order
        </span>
        <span className={styles.textInfo}>
          By paying this order you authorize Whola to automatically deduct the
          balance payment when stock lands
        </span>
        <span className={styles.textInfo}>
          For full order terms visit whola.com.au/termsandconditions
        </span>
      </div>
    </div>
  )
}
