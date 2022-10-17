import axios from "axios";
// import { constants } from "../utils/constant";
import { getVbaseData } from "./vbase";
export async function getBuyerInvoiceDetails(ctx:any){

    const newOrderId :any= ctx.vtex.route.params.orderId;
    console.log("getBuyerInvoiceDetails==>",newOrderId); 
    
    
    const {
        vtex:{
            account,authToken
        },
        clients:{
            apps
        }
    }=ctx;
    console.log({account,authToken})
    const appId = process.env.VTEX_APP_ID as string
    console.log(appId)
    const customFields = await apps.getAppSettings(appId)
    console.log(customFields)
    const details:any={
        method:"GET",
        url:`https://vtexasia.vtexcommercestable.com.br/api/oms/pvt/orders/${newOrderId}`,
        headers:{
            Accept:'application/json',
            'Content-type':'application/json',
            // "X-VTEX-Use-Https": "true",
            // 'VtexIdclientAutCookie':authToken
            'X-VTEX-API-AppKey':customFields.app_key,
            'X-VTEX-API-AppToken':customFields.app_token
        }
    };
    // console.log('orderId',newOrderId.split("-")[0])
    const vbaseNewOrder = newOrderId.split("-")[0]
    
    const vbase = await getVbaseData(ctx,vbaseNewOrder);

    // Object.keys(vbase).forEach((key)=>{})


    console.log('vbase',vbase)
    const orderDetails=await axios.request(details).then( function (response:any){
        // ctx.status=200;
        // ctx.body={vbase:vbase,data:buyerDetails}
        console.log("Response Data ====================>",response.data)
        
        return response.data;
    }).catch(function(error:any){
        console.log(error);
        return null;
    })
    console.log(orderDetails)
    ctx.status=200;
    ctx.body={vbase:vbase,data:orderDetails}
return  ;
}