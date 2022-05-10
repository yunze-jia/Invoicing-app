/* global jsPDF */
import React, {useEffect, useState} from 'react'
import {constants} from "../node/utils/constant";
import axios from "axios";
import {BuyerTemplate} from './templates/buyer';
import {SellerTemplate} from './templates/seller';
const styles = require('./index.css')


const invoice = (props) => {
    const ref = React.createRef();
    console.log(props)
    // const orderId = props.params ? props.params.order_id : null;
    // const invoiceUrl = props.params ? props.params.invoice_url : null;
    // // const orderDetails =  await getOrderDetails(orderId,"vtexasia")
    // const [order, setOrder] = useState([]);
    //
    useEffect(() => {
        injectScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.min.js")
    }, [])
    //
    // const getOrderDetails = async (orderId) => {
    //
    //     const options:any = {
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
    //     const orderDetails:any = await axios.request(options).then(function (response) {
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
    //
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
    //
    //
    const injectScript = ( src) => {
        // if (document.getElementById(id)) {
        //     return
        // }

        const head = document.getElementsByTagName('head')[0]

        const js = document.createElement('script')
        // js.id = id
        js.src = src
        js.async = true
        js.defer = true
        // js.onload = onLoad

        head.appendChild(js)
    }
    //
    //
    //
    // const downloadPdf = ()=>{
    //
    //     window.print();
    //     // var doc = new jsPDF("p","pt","a4");
    //     // doc.html(document.querySelector("#source") as HTMLCanvasElement,
    //     //     {
    //     //         callback: function (pdf) {
    //     //             pdf.save("abc.pdf")
    //     //         }
    //     //     })
    //
    //     // const html = document.querySelector('#source') as HTMLCanvasElement
    //     // let savebtn = document.querySelector('#savebtn') as HTMLCanvasElement
    //     // html2canvas(html,{
    //     //     onclone: (document)=>{
    //     //         savebtn.style.visibility  = 'hidden';
    //     //     }
    //     // }).then((canvas)=>{
    //     //     const img = canvas.toDataURL('image/jpeg');
    //     //     const pdf = new jsPDF()
    //     //     pdf.addImage(img,'JPEG',0,0,10,10);
    //     //     pdf.save('abc.pdf')
    //     // });
    //
    //     // console.log(html)
    //
    //  }

    const Template = props.params.type === 'buyer' ? <BuyerTemplate body={props}/> :<SellerTemplate body={props} />;

    return (
        <div className={styles.container}>
            {Template}
            {/*<button id="savebtn" onClick={downloadPdf}>Download PDF</button>*/}
            {/*<p>Hello WOrld</p>*/}
            {/*<div id="source">
            <div>
                <span>
                    <h1 className={styles.invoicestyle}>Invoice</h1>
                </span>
                <span className={styles.bold}>Invoice Number :</span><span className={styles.invoiceNumber}> {order.invoiceNumber}</span>
            </div>
            <div>
                <span className={styles.bold}>Order Id : </span><span>{order.orderId}</span>
                <span className={styles.floatright}><span className={styles.bold}>Order Date : </span> <span>29-01-25</span></span>
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
                        <p>Grand Total : { order?.totals?.[0]?.value }</p>
                        <p>Discount    : { order?.totals?.[1]?.value }</p>
                    </span>
                </table>
            </div>
            </div>*/}

        </div>
    )
}


export default invoice
