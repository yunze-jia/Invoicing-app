import {json} from 'co-body'
import {constants} from "../utils/constant";

const axios = require("axios");

// export async function ordersWebhook(ctx: any){
//     console.log('I am in order webhooks')
//     ctx.status = 200;
//     ctx.body = ctx.req;
// }

export async function ordersWebhook(ctx: any) {
    const {
        vtex:{
            account
        }
    } = ctx;
    ctx.status = 200
    // console.log(ctx.req)
    const payload: any = await json(ctx.req)
    console.log('the payload is  : ', payload)

    if(!payload){
        ctx.status = 200;
        return
    }

    const orderDetails : any = await getOrderDetails(payload.OrderId,account);
    const date = new Date();
    const body:any = {
        orderId:payload.OrderId,
        customerId:orderDetails.clientProfileData.userProfileId,
        createdDate:date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear(),
        sellerId:orderDetails.sellers[0].id
    }
    const invoiceNumber :any = await createDocumentInvoice(body,account);
    const details = await notifyBuyer(payload.OrderId,orderDetails.clientProfileData.email,account,invoiceNumber.DocumentId);
    console.log(details)
    // console.log(orderDetails)
    // await next();
    return
}

//Create Document Invoice
async function createDocumentInvoice(data:any,account:string){
    const options = {
        method: 'POST',
        url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/dataentities/${constants.INVOICE_DATA_ENTITITY_NAME}/documents?_schema=${constants.INVOICE_SCHEMA}`,
        headers: {
            Accept: 'application/vnd.vtex.ds.v10+json',
            'Content-Type': 'application/json',
            'X-VTEX-API-AppKey': 'vtexappkey-vtexasia-SFAJSB',
            'X-VTEX-API-AppToken': 'ZOLHOEDDEIIPWMNCAPAEGVLKXUBVXUZKCQFHZHFWZQZLITBXPUPBCBZEDBJUCHGJJXMFGFCSJDEPWZBESDGCFXIBQBEYXLTSKPCKGVQJRWRYWKIDZFBYBDELPKOEBEVY'
        },
        data: data
    };

    const invoice_document = await axios.request(options).then(function (response:any) {
        console.log('create document for invoice : ', response.data);
        return response.data;
    }).catch(function (error :any) {
        console.error(error);
    });
    return invoice_document;
}

//GET ORDER DETAILS
async function getOrderDetails(orderId: any,account:string) {

    const options = {
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
        return response.data;
    }).catch(function (error: any) {
        console.log(error);
    });
    return orderDetails;
}

async function notifyBuyer(orderId:any,email:string,account:string, invoiceNo:string) {
    console.log('the order id is : ' + orderId + ' the account is : ' + account)
    const options = {
        method: 'POST',
        url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/mail-service/pvt/sendmail`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VTEX-API-AppKey': constants.APP_KEY,
            'X-VTEX-API-AppToken': constants.APP_TOKEN
        },
        data: {
            'TemplateName': 'order-confirmed',
            'applicationName': 'email',
            'logEvidence': false,
            'jsonData': {
                'email': email,
                'invoiceUrl': `https://tnia--vtexasia.myvtex.com/invoice/${orderId}/${invoiceNo}`,
                'message': 'This is a test'
            }
        }
    };

    const emailRes = await axios.request(options).then(function (response: any) {
        console.log(response.data);
        return response.data;
    }).catch(function (error: any) {
        console.log(error);
    });
    return emailRes;
}

export async function sendEmail(ctx:any){
    const options = {
        method: 'POST',
        url: `https://vtexasia.vtexcommercestable.com.br/api/mail-service/pvt/sendmail`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VTEX-API-AppKey': constants.APP_KEY,
            'X-VTEX-API-AppToken': constants.APP_TOKEN
        },
        data: {
            "TemplateName": "order-confirmed",
            "applicationName": "email",
            "logEvidence": "false",
            "jsonData": {
                "email": "2e02e932767849449b6a57c482447aaa@ct.vtex.com.br",
                "invoiceUrl": "https://tnia--vtexasia.myvtex.com/invoice/789",
                "message": "This is a test"
            }
        }
    };

    const emailRes = await axios.request(options).then(function (response: any) {
        console.log(response.data);
        return response.data;
    }).catch(function (error: any) {
        console.log(error);
    });
    ctx.status = 200;
    ctx.body = emailRes;
    return emailRes;
}
