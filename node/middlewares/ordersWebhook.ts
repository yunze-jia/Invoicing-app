import {json} from 'co-body'
import {constants} from "../utils/constant";
import { getVbaseData, saveVbaseData } from './vbase';

const axios = require("axios");

// export async function ordersWebhook(ctx: any){
//     console.log('I am in order webhooks')
//     ctx.status = 200;
//     ctx.body = ctx.req;
// }

export async function ordersWebhook(ctx: any) {
    const {
        vtex: {
            account
        },
        clients:{
            apps
        }
    } = ctx;
    ctx.status = 200
    try {
        const payload: any = await json(ctx.req)
        console.log('the payload is  : ', payload)
        //
        if (!payload) {
            ctx.status = 200;
            return
        }
        const appId = process.env.VTEX_APP_ID as string
        const customFields = await apps.getAppSettings(appId)
        console.log(customFields)
        const orderDetails: any = await getOrderDetails(payload.OrderId, account,customFields,ctx);
        // const newBuyerOrderDetails:any=await getBuyerInvoiceDetails(payload.OrderId,account,customFields,ctx)
        // console.log("New buyer Order Details ========>",newBuyerOrderDetails)
        console.log('Order Details ========>',JSON.stringify(orderDetails))
        const sellerEmail: any = await getSellerEmailById(orderDetails.items, account,customFields)
        console.log("SellerDetails",orderDetails.items)
        const date = new Date();
        const body: any = {
            orderId: payload.OrderId,
            customerId: orderDetails.clientProfileData.userProfileId,
            createdDate: date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear(),
            sellerId: orderDetails.sellers[0].id
        }
        const invoiceNumber: any = await createDocumentInvoice(body, account,customFields);
        if(payload.OrderId.split('-')[1]==='01')
        {

            const buyerDetails = await notifyBuyer(payload.OrderId, orderDetails.clientProfileData.email, account, invoiceNumber.DocumentId,customFields);
            console.log(buyerDetails)
        }
        sellerEmail.forEach(async (data: any) => {
            await
                notifySeller(payload.OrderId, data, account, invoiceNumber.DocumentId,customFields);
        })

        // console.log(orderDetails)
        // await next();
        return
    } catch (e) {
        console.log(e);
        return
    }

}

//Create Document Invoice
async function createDocumentInvoice(data: any, account: string,customFields:any) {
    const options = {
        method: 'POST',
        url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/dataentities/${constants.INVOICE_DATA_ENTITITY_NAME}/documents?_schema=${constants.INVOICE_SCHEMA}`,
        headers: {
            Accept: 'application/vnd.vtex.ds.v10+json',
            'Content-Type': 'application/json',
            // 'X-VTEX-API-AppKey': apps.getAppSettings('app_key'),
            'X-VTEX-API-Appkey':customFields.app_key,
            'X-VTEX-API-AppToken':customFields.app_token,
            // 'X-VTEX-API-AppToken': 'ZOLHOEDDEIIPWMNCAPAEGVLKXUBVXUZKCQFHZHFWZQZLITBXPUPBCBZEDBJUCHGJJXMFGFCSJDEPWZBESDGCFXIBQBEYXLTSKPCKGVQJRWRYWKIDZFBYBDELPKOEBEVY'
        },
        data: data
    };
    // console.log(apps,"hello")

    const invoice_document = await axios.request(options).then(function (response: any) {
        console.log('create document for invoice : ', response.data);
        return response.data;
    }).catch(function (error: any) {
        console.error(error);
    });
    return invoice_document;
}

//GET ORDER DETAILS
async function getOrderDetails(orderId: any,account:string,customFields:any,ctx:any) {
console.log("getOrderDetails was called");

    const options = {
        method: 'GET',
        url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/oms/pvt/orders/${orderId}`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VTEX-API-Appkey':customFields.app_key,
            'X-VTEX-API-AppToken':customFields.app_token
            // 'X-VTEX-API-AppKey': constants.APP_KEY,
            // 'X-VTEX-API-AppToken': constants.APP_TOKEN
        }
    };
    const orderDetails = await axios.request(options).then(function (response: any) {
        console.log(response.data);
        return response.data;
    }).catch(function (error: any) {
        console.log(error);
        return error;
    });
    console.log("orderDetails=====>",orderDetails)

    const newBuyerOrderDetails:any=await getBuyerInvoiceDetails(orderId,account,customFields,ctx)
        console.log("New buyer Order Details ========>",newBuyerOrderDetails)
    return orderDetails;

}
//get Buyer order details
const getBuyerInvoiceDetails=async(orderId: any,account:string,customFields:any,ctx:any)=>{
    console.log("getBuyerInvoiceDetails was called");
    
    const newOrderId=orderId.split("-");
    console.log("orderId in orderDails===>",orderId,newOrderId)
    const options = {
        method: 'GET',
        url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/oms/pvt/orders/${orderId}`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VTEX-API-Appkey':customFields.app_key,
            'X-VTEX-API-AppToken':customFields.app_token
            // 'X-VTEX-API-AppKey': constants.APP_KEY,
            // 'X-VTEX-API-AppToken': constants.APP_TOKEN
        }
    };

    let saveToVbaseResponse;
    const orderDetails = await axios.request(options).then(function (response: any) {
        console.log('order details response----->',response.data);
        return response.data;
    }).catch(function (error: any) {
        console.log(error);
    });

    const vbaseOrderDetails:any=await getVbaseData(ctx,newOrderId[0])
    

    if( vbaseOrderDetails != null)
    {
        let shippingData=orderDetails.shippingData;
        let changeobj:any = orderDetails.items.map((data:any) => ({name:data.name,price:data.price,quantity:data.quantity,priceDefinition:data.priceDefinition}))
        
        
       vbaseOrderDetails[newOrderId[1]] = {items:changeobj};
       vbaseOrderDetails[newOrderId[1]].totals = orderDetails.totals;
       vbaseOrderDetails[newOrderId[1]].grandTotal=orderDetails.value;
       vbaseOrderDetails['shippingData']=shippingData;

       vbaseOrderDetails['orderId']=orderDetails.orderId.split('-')[0];
    //    vbaseOrderDetails[`grandTotal${newOrderId[1]}`]=orderDetails.value;
       


       console.log('Order Id save-->',newOrderId[0])
       
       saveToVbaseResponse= await saveVbaseData(newOrderId[0],vbaseOrderDetails,ctx);
    }
    else{
        let saveObj:any = {}
        const items = orderDetails.items.map((data:any) => ({name:data.name,price:data.price,quantity:data.quantity,priceDefinition:data.priceDefinition}));
        saveObj[newOrderId[1]] = {items:items};
        saveObj[newOrderId[1]].totals = orderDetails.totals;
        saveObj[newOrderId[1]].grandTotal=orderDetails.value;
        console.log('Order Id save-->',newOrderId[0])

         saveToVbaseResponse= await saveVbaseData(newOrderId[0],saveObj,ctx);
         
    }
    console.log('Order Id save-->',newOrderId[0])
    const vbaseOrderDetails1:any =await getVbaseData(ctx,newOrderId[0])
    
    console.log('Vbase Save response-------> ',saveToVbaseResponse)
    console.log('Vbase Get saved response-------> ',vbaseOrderDetails1)
    console.log("vBase=======>",{saveToVbaseResponse,newOrderId,orderDetails,vbaseOrderDetails,vbaseOrderDetails1} )


    return orderDetails;
}

async function notifyBuyer(orderId:any,email:string,account:string, invoiceNo:string,customFields:any) {
    console.log('the order id is : ' + orderId + ' the account is : ' + account)

    const options = {
        method: 'POST',
        url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/mail-service/pvt/sendmail`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VTEX-API-Appkey':customFields.app_key,
            'X-VTEX-API-AppToken':customFields.app_token
            // 'X-VTEX-API-AppKey': constants.APP_KEY,
            // 'X-VTEX-API-AppToken': constants.APP_TOKEN
        },
        data: {
            'TemplateName': 'order-confirmed',
            'applicationName': 'email',
            'logEvidence': false,
            'jsonData': {
                'cc':customFields.marketplace_email,
                'email': email,
                'invoiceUrl': `https://dnia--vtexasia.myvtex.com/invoice/buyer/${orderId}/${invoiceNo}`,
                'message': 'This is a test'
            }
            
        }
    };
    console.log("BuyerEmail==========>",options.data)

    const emailRes = await axios.request(options).then(function (response: any) {
        console.log(response.data);
        return response.data;
    }).catch(function (error: any) {
        console.log(error);
    });
    console.log("buyer email res",emailRes)
    return emailRes;
}

async function notifySeller(orderId: any, data: any, account: string, invoiceNo: string,customFields:any) {
    console.log('the order id is : ' + orderId + ' the account is : ' + account)
    const options = {
        method: 'POST',
        url: `https://${account}.${constants.VTEX_COMMERCE_BASE_URL}/mail-service/pvt/sendmail`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VTEX-API-AppKey': customFields.app_key,
            'X-VTEX-API-AppToken': customFields.app_token
        },
        data: {
            'TemplateName': 'order-confirmed',
            'applicationName': 'email',
            'logEvidence': false,
            'jsonData': {
                'cc':customFields.marketplace_email,
                'email': data.email,
                'invoiceUrl': `https://dnia--vtexasia.myvtex.com/invoice/seller/${data.sellerId}/${orderId}/${invoiceNo}`,
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


async function getSellerEmailById(sellers: any, account: string,customFields:any) {
    const ids = sellers.map((o: any) => o.seller)
    const sellerIds = ids.filter((id: any, index: any) => !ids.includes(id, index + 1))
    const sellerEmails = []
    for (let seller of sellerIds) {
        const options = {
            method: 'GET',
            url: `https://${account}.${constants.SELLER_ENDPOINT}${seller}`,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VTEX-API-AppKey': customFields.app_key,
                'X-VTEX-API-AppToken': customFields.app_token,
            }
        };

        const email = await axios.request(options).then(function (response: any) {
            console.log(response.data);
            return response.data.Email;
        }).catch(function (error: any) {
            console.log(error);
        });
        sellerEmails.push({email: email, sellerId: seller});
    }
    return sellerEmails;
}

// export async function sendEmail(ctx: any) {
//     const options = {
//         method: 'POST',
//         url: `https://vtexasia.vtexcommercestable.com.br/api/mail-service/pvt/sendmail`,
//         headers: {
//             Accept: 'application/json',
//             'Content-Type': 'application/json',
//             'X-VTEX-API-AppKey': constants.APP_KEY,
//             'X-VTEX-API-AppToken': constants.APP_TOKEN
//         },
//         data: {
//             "TemplateName": "order-confirmed",
//             "applicationName": "email",
//             "logEvidence": "false",
//             "jsonData": {
//                 "email": "2e02e932767849449b6a57c482447aaa@ct.vtex.com.br",
//                 "invoiceUrl": "https://tnia--vtexasia.myvtex.com/invoice/789",
//                 "message": "This is a test"
//             }
//         }
//     };

//     const emailRes = await axios.request(options).then(function (response: any) {
//         console.log(response.data);
//         return response.data;
//     }).catch(function (error: any) {
//         console.log(error);
//     });
//     ctx.status = 200;
//     ctx.body = emailRes;
//     return emailRes;
// }
