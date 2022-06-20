const authorizationsBucket="NIA";

export async function getVbaseData(ctx: Context, key: any) {
    try {
        return await ctx.clients.vbase
            .getJSON<{ orderId: string } | undefined>(authorizationsBucket, key)
            .then((res:any) => res)
    } catch (e) {
        console.log('get vabse error : ',e)
        return null;
    }
}

export async function saveVbaseData(
    key: any,
    value: string,
    ctx: Context
) {
    try {
        return await ctx.clients.vbase
            .saveJSON<string | undefined>(authorizationsBucket, key, value)
            .then((_) => 'success')
    } catch (e) {
        console.error(e)
        return e;
    }

}