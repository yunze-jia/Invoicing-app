const axios = require("axios");

export async function orderHooks(ctx: any, next: () => Promise<any>) {
    console.log(ctx.req)
    const options = {
        method: 'POST',
        url: 'https://vtexasia.myvtex.com.br/api/orders/hook/config',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-VTEX-API-AppKey': 'vtexappkey-vtexasia-SFAJSB',
            'X-VTEX-API-AppToken': 'ZOLHOEDDEIIPWMNCAPAEGVLKXUBVXUZKCQFHZHFWZQZLITBXPUPBCBZEDBJUCHGJJXMFGFCSJDEPWZBESDGCFXIBQBEYXLTSKPCKGVQJRWRYWKIDZFBYBDELPKOEBEVY'
        },
        data: {
            "filter": {
                "type": "FromWorkflow",
                "status": ["order-completed", "handling", "ready-for-handling", "waiting-ffmt-authorization", "cancel"]
            },
            "hook": {
                "url": "https://tnia--vtexasia.myvtex.com/_v/ordersWebhook",
                "headers": {
                    "key": "value"
                }
            }
        }
    };

    await axios.request(options).then(function (response: any) {
        console.log(response.data);
        ctx.status = 200
        ctx.body = response.data
    }).catch(function (error: any) {
        console.error(error);
        ctx.status = 404
        ctx.body = error
    });

    await next()
}
