/* global jsPDF */
import React, { useEffect, useState } from 'react'
import { constants } from "../node/utils/constant";
// import axios from "axios";
import { BuyerTemplate } from './templates/buyer';
import { SellerTemplate } from './templates/seller';
const styles = require('./index.css')


const invoice = (props) => {
    const ref = React.createRef();
    console.log("seller props" + props)
    // const orderId = props.params ? props.params.order_id : null;
    // const invoiceUrl = props.params ? props.params.invoice_url : null;
    // // const orderDetails =  await getOrderDetails(orderId,"vtexasia")
    // const [order, setOrder] = useState([]);
    //
    useEffect(() => {
        injectScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.min.js")
    }, [])

    const injectScript = (src) => {
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

    const Template = props.params.type === 'buyer' ? <BuyerTemplate body={props} /> : <SellerTemplate body={props} />;

    return (
        <div className={styles.container}>
            {Template}

        </div>
    )
}


export default invoice
