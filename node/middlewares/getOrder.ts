import {constants} from "../utils/constant";
// import {json} from "co-body";
import axios from "axios";

export async function getOrderDetails(ctx:any) {
    const orderId = ctx.vtex.route.params.orderId;
    const {
        vtex : {
            account
        }
    } = ctx;
    const options :any = {
        method: 'GET',
        url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/oms/pvt/orders/${orderId}`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VTEX-API-AppKey': constants.APP_KEY,
            'X-VTEX-API-AppToken': constants.APP_TOKEN
        }
    };

    const orderDetails = await axios.request(options).then(function (response: any) {
        console.log(response.data);
        ctx.status = 200
        return response.data;
    }).catch(function (error: any) {
        ctx.status = 201
        console.log(error);
    });
    ctx.body = orderDetails;
    return orderDetails;
}
