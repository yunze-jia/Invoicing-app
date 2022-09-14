const authorizationsBucket="NIA";

export async function getVbaseData(ctx: Context, key: string) {
    try {
        return await ctx.clients.vbase
            .getJSON<{ orderId: string } | undefined>(authorizationsBucket, key)
            .then((res:any) => {
                console.log({res})
                return res
            })
    } catch (e) {
        if(e.response.statusText === 'Not Found')
            console.log('File Not Found --> ',e.response.data)
        else{
            console.log('Vbase Error --> ',e.response.data);
        }
        return null;
    }
}

export async function saveVbaseData(
    key: string,
    value: string,
    ctx: Context
) {
    try {
        return await ctx.clients.vbase
            .saveJSON<string | undefined>(authorizationsBucket, key, value)
            .then((_) => {
                console.log({_})
                return 'success'
            })
    } catch (e) {
        console.error(e)
        return e;
    }

}