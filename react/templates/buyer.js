import {constants} from "../../node/utils/constant";
import axios from "axios";

const styles = require('../index.css');
import React, {useEffect, useState} from 'react'
import {getOrderDetails} from "../services/order";


export const BuyerTemplate = ({body}) => {
    console.log(body)
    const orderId = body.params ? body.params.order_id : null;
    const invoiceUrl = body.params ? body.params.invoice_url : null;
    const type = body.params ? body.params.type : null;
    const sellerId = body.params ? body.params.sellerId : null;
    // const orderDetails =  await getOrderDetails(orderId,"vtexasia")
    const [order, setOrder] = useState([]);

    useEffect(() => {
        async function setOrderDetails() {
            if (orderId) {
                setOrder(await getOrderDetails(orderId, invoiceUrl, type, sellerId));
            }
        }

        setOrderDetails();

    }, [])

    // const getOrderDetails = async (orderId) => {
    //
    //     const options = {
    //         method: 'POST',
    //         url: `/_v/order/${orderId}`,
    //         headers: {
    //             Accept: 'application/json',
    //             'Content-Type': 'application/json',
    //             'X-VTEX-API-AppKey': constants.APP_KEY,
    //             'X-VTEX-API-AppToken': constants.APP_TOKEN
    //         }
    //     };
    //
    //     const orderDetails = await axios.request(options).then(function (response) {
    //         console.log(response.data);
    //         return response.data;
    //     }).catch(function (error) {
    //         console.log(error);
    //     });
    //     // let invoiceNumber = await generateInvoiceNumber(orderDetails.orderId);
    //     orderDetails.invoiceNumber = invoiceUrl;
    //     let items = await createTableProducts(orderDetails.items);
    //     orderDetails.htmlItems = items;
    //     setOrder(orderDetails);
    //     return orderDetails;
    // }

    // const createTableProducts = async(items)=>{
    //     let htmlItems = [];
    //     for (const [index, value] of items.entries()) {
    //         htmlItems.push(<tr>
    //             <td>{index + 1}</td>
    //             <td>{value.name}</td>
    //             <td>{value.quantity}</td>
    //             <td>{value.price}</td>
    //         </tr>)
    //     };
    //     return htmlItems;
    // }


    const downloadPdf = () => {

        window.print();

    }

    return (
        <div>
            {/*<BuyerTemplate body={body}></BuyerTemplate>*/}
            <button id="savebtn" onClick={downloadPdf}>Download PDF</button>
            {/*<p>Hello WOrld</p>*/}
            <div id="source">
                <div>
                <span>
                    <h1 className={styles.invoicestyle}>Invoice</h1>
                </span>
                    <span className={styles.bold}>Invoice Number :</span><span
                    className={styles.invoiceNumber}> {order.invoiceNumber}</span>
                </div>
                <div>
                    <span className={styles.bold}>Order Id : </span><span>{order.orderId}</span>
                    <span className={styles.floatright}><span
                        className={styles.bold}>Order Date : </span> <span>29-01-25</span></span>
                </div>

                <div>
                <span>
                    <h1 className={styles.shipto}>
                        SHIP TO
                    </h1>
                    <p>{order.shippingData?.address?.street}</p>
                    <p>{order.shippingData?.address?.city}</p>
                    <p>{order.shippingData?.address?.state}</p>
                    <p>{order.shippingData?.address?.country}</p>
                </span>
                </div>
                <div>
                    <h1 className={styles.shipto}>
                        Products
                    </h1>
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
                        {order.htmlItems}
                        </tbody>
                        <span>
                        <p>Grand Total : {order?.totals?.[0]?.value}</p>
                        <p>Discount    : {order?.totals?.[1]?.value}</p>
                    </span>
                    </table>
                </div>
            </div>

        </div>
    )
}


