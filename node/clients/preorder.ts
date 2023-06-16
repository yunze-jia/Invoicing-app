import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

export default class PreOrder extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(
      `http://ec2-13-211-128-127.ap-southeast-2.compute.amazonaws.com`,
      ctx,
      {
        ...options,
        headers: {
          ...options?.headers,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    )
  }

  public async getPreOrder(orderId: string, customFields: any) {
    return this.http.get(`/payment-intent/order?orderId=${orderId}`, {
      auth: {
        username: customFields.username,
        password: customFields.password,
      },
    })
  }
}
