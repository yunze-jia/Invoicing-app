import { InstanceOptions, IOContext, JanusClient, RequestConfig } from "@vtex/api";
import { checkoutCookieFormat, ownershipCookieFormat } from "../utils/cookie";
import { statusToError } from "../utils/errorHandler";

export default class OrderClient extends JanusClient {

  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        VtexIdclientAutCookie:
          ctx.storeUserAuthToken ?? ctx.adminUserAuthToken ?? ctx.authToken,
      },
    })
  }

  public order = (id: string) =>
    this.get<any>(this.routes.order(id), { metric: 'oms-order' })

  public orderBySequence = (seqNumber: string) =>
    this.get<any>(this.routes.orderBySequence(seqNumber), { metric: 'oms-order' })

  public orders = (filter: string) =>
    this.get(this.routes.orders(filter), { metric: 'oms-order' })


    private getCommonHeaders = () => {
      const { orderFormId, ownerId, segmentToken, sessionToken } = this
        .context as CustomIOContext
  
      const checkoutCookie = orderFormId ? checkoutCookieFormat(orderFormId) : ''
      const ownershipCookie = ownerId ? ownershipCookieFormat(ownerId) : ''
      const segmentTokenCookie = segmentToken
        ? `vtex_segment=${segmentToken};`
        : ''
  
      const sessionTokenCookie = sessionToken
        ? `vtex_session=${sessionToken};`
        : ''
  
      return {
        Cookie: `${checkoutCookie}${ownershipCookie}${segmentTokenCookie}${sessionTokenCookie}`,
      }
    }

    protected get = <T>(url: string, config: RequestConfig = {}) => {
      config.headers = {
        ...config.headers,
        ...this.getCommonHeaders(),
      }
  
      return this.http.get<T>(url, config).catch(statusToError) as Promise<T>
    }

  private get routes() {
    const base = '/api/oms'

    return {
      // lastOrder: `${base}/user/orders/last`,
      order: (id: string) => `${base}/pvt/orders/${id}`,
      orderBySequence: (seqNumber: string) => `${base}/pvt/orders/?seq{sequence-number}=${seqNumber}`,
      orders: (filter: string) => `${base}/pvt/orders${filter}`,
    }
  }
}