import { ExternalClient, InstanceOptions, IOContext } from "@vtex/api";

export default class OrderHooks extends ExternalClient {
    constructor(ctx: IOContext, options?: InstanceOptions) {
      super(`http://${ctx.account}.vtexcommercestable.com.br`, ctx, {
        ...options,
        headers: {
          ...options?.headers,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Vtex-Use-Https': 'true',
          VtexIdclientAutCookie: ctx.adminUserAuthToken ?? ctx.authToken,
        },
      })
    }

    public async createOrderHook(data:any){
        return this.http.post('/api/orders/hook/config',data);
    }

}