const axios = require("axios");

export async function orderHooks(ctx: any, next: () => Promise<any>) {
    const {
        vtex:{account,authToken},
        clients:{apps}
    } = ctx;
    const appId = process.env.VTEX_APP_ID as string
    const customFields = await apps.getAppSettings(appId)
    console.log(customFields)
    const workspace = ctx.req.headers['x-vtex-workspace']
    console.log("workspace=======>",workspace)
    const options = {
        method: 'POST',
        url: `http://${account}.vtexcommercestable.com.br/api/orders/hook/config`,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            // 'X-VTEX-API-AppKey': customFields.app_key,
            // 'X-VTEX-API-AppToken': customFields.app_token,
            "X-VTEX-Use-Https": "true",
            VtexIdClientAutCookie: authToken,
        },
        data: {
            "filter": {
                "type": "FromWorkflow",
                "status": ["invoiced"]
                // "status": ["order-completed", "handling", "ready-for-handling", "waiting-ffmt-authorization", "cancel"]
            },
            "hook": {
                "url": `https://${workspace}--${account}.myvtex.com/_v/ordersWebhook`,
                "headers": {
                    "key": "value"
                }
            }
        }
    };
    console.log(options.data)
    const orderhook = await axios.request(options).then(function (response: any) {
        console.log(response.data);
        // ctx.status = 200
        // ctx.body = response.data
        return {isError:false,payload:response.data};
    }).catch(function (error: any) {
        console.error(error.response);
        // ctx.status = error.respnse.status
        // ctx.body = error.response
        return {isError:true,payload:error.response}
    });
    console.log(orderhook.payload)
    ctx.status = orderhook.isError ? 500 : 200;
    ctx.body = JSON.stringify(orderhook) 

    await next()
}
