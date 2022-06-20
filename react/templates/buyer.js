import { constants } from '../../node/utils/constant'
import axios from 'axios'

const styles = require('../index.css')
import React, { useEffect, useState } from 'react'
import { getOrderDetails, getNewBuyerOrderDetails } from '../services/order'

export const BuyerTemplate = ({ body }) => {
  console.log(body)
  const orderId = body.params ? body.params.order_id : null
  const invoiceUrl = body.params ? body.params.invoice_url : null
  const type = body.params ? body.params.type : null
  const sellerId = body.params ? body.params.sellerId : null
  // const orderDetails =  await getOrderDetails(orderId,"vtexasia")
  const [order, setOrder] = useState([])

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
    }
  }


  const downloadPdf = () => {
    window.print()
  }

  return (
    <div>
      {/*<BuyerTemplate body={body}></BuyerTemplate>*/}
      <button id="savebtn" onClick={downloadPdf}>
        Download PDF
      </button>
      {/*<p>Hello WOrld</p>*/}
      <div id="source">
        <div>
          <span>
            <h1 className={styles.invoicestyle}>Invoice</h1>
          </span>
          <span className={styles.bold}>Invoice Number :</span>
          <span className={styles.invoiceNumber}> {order.invoiceNumber}</span>
        </div>
        <div>
          <span className={styles.bold}>Order Id : </span>
          <span>{order.vbase?.orderId}</span>
          <span className={styles.floatright}>
            <span className={styles.bold}>Order Date : </span>{' '}
            <span>29-01-25</span>
          </span>
        </div>

        <div>
          <span>
            <h1 className={styles.shipto}>SHIP TO</h1>
            <p>{order.vbase?.shippingData?.address?.street}</p>
            <p>{order.vbase?.shippingData?.address?.city}</p>
            <p>{order.vbase?.shippingData?.address?.state}</p>
            <p>{order.vbase?.shippingData?.address?.country}</p>
          </span>
        </div>
        <div>
          <h1 className={styles.shipto}>Products</h1>
          <table className={styles.tablea}>
            <thead>
              <tr>
                <th>id</th>
                <th>Name</th>
                <th>quantity</th>
                <th>price</th>
              </tr>
            </thead>
            <tbody className={styles.aligntablecenter}>
              {order?.htmlItems?.htmlItems}
            </tbody>
            <span>
              <p>Grand Total : {(order?.htmlItems?.grand)/100}</p>
              <p>Discount : {(order?.htmlItems?.discount)/100}</p>
            </span>
          </table>
        </div>
      </div>
    </div>
  )
}
