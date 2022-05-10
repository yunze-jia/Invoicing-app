import {constants} from "../../node/utils/constant";
import axios from "axios";
import React from "react";

export const getOrderDetails = async (orderId, invoiceUrl, type, sellerId) => {

    const options = {
        method: 'POST',
        url: `/_v/order/${orderId}`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VTEX-API-AppKey': constants.APP_KEY,
            'X-VTEX-API-AppToken': constants.APP_TOKEN
        }
    };

    const orderDetails = await axios.request(options).then(function (response) {
        console.log(response.data);
        return response.data;
    }).catch(function (error) {
        console.log(error);
    });
    // let invoiceNumber = await generateInvoiceNumber(orderDetails.orderId);
    orderDetails.invoiceNumber = invoiceUrl;
    const seller = type === 'seller' ? orderDetails.items.filter((res) => {
        if (res.seller === sellerId)
            return res;

    }) : orderDetails.items;
    let items = await createTableProducts(seller);
    orderDetails.htmlItems = items;
    return orderDetails;
}

const createTableProducts = async (items) => {
    let htmlItems = [];
    for (const [index, value] of items.entries()) {
        htmlItems.push(<tr>
            <td>{index + 1}</td>
            <td>{value.name}</td>
            <td>{value.quantity}</td>
            <td>{value.price}</td>
        </tr>)
    }
    ;
    return htmlItems;
}
