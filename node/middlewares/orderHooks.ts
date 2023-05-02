import { ServiceContext } from '@vtex/api'
import axios from 'axios'

export async function orderHooks(
  ctx: ServiceContext,
  // next: () => Promise<any>
) {
  const {
    clients: { apps },
    vtex: { account, authToken },
  } = ctx
  console.log('IN HOOK', authToken)

  const appId = process.env.VTEX_APP_ID as string
  const customFields = await apps.getAppSettings(appId)

  console.log('custom fields ', customFields)
  const workspace = ctx.req.headers['x-vtex-workspace']
  const options: any = {
    method: 'POST',
    url: `http://${account}.vtexcommercestable.com.br/api/orders/hook/config`,
    headers: {
      'X-VTEX-Use-Https': 'true',
      VtexIdClientAutCookie: authToken,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      // 'X-VTEX-API-AppKey': customFields.app_key,
      // 'X-VTEX-API-AppToken': customFields.app_token,
    },
    data: {
      filter: {
        type: 'FromWorkflow',
        status: ['invoiced'],
      },
      queue: {
        visibilityTimeoutInSeconds: 240,
        messageRetentionPeriodInSeconds: 345600,
      },
      hook: {
        url: `https://${
          workspace && workspace !== 'master' ? `${workspace}--` : ``
        }${account}.myvtex.com/_v/orders/webhook`,
        headers: {
          key: 'value',
        },
      },
    },
  }
  const orderhook: any = await axios
    .request(options)
    .then((response: any) => {
      console.log(response.data)
      return { isError: false, paylaod: response.data }
    })
    .catch((error: any) => {
      console.error('HOOK - ', error)
      console.error('HOOK RESPONSE - ', error.response)
      console.error('HOOK RESPONSE DATA - ', error.response.data)
      return { isError: true, payload: error.response }
    })
  console.log('orderhook', orderhook)
  ctx.status = orderhook.isError ? 500 : 200
  ctx.body = JSON.stringify(orderhook.payload)
  ctx.set('Cache-Control', 'no-cache')
  // await next()
}

export async function getUser(ctx: any) {
  // const {
  //   clients: { masterdata },
  // } = ctx;
  // const result:any = [];
  // const {files:[file], fields} = await asyncBusboy(ctx.req);

  // files.pipes(csvParser())
  // .on("data", (data:any) => {
  //   result.push(data);
  // })
  // const file = await json(ctx.req)
  // console.log('In Get User function - ',result);
  // console.log('In Get User function a - ',fields);
  // console.log('Store token ', ctx.vtex.storeUserAuthToken)
  // console.log('Auth Token ', ctx.vtex.authToken)
  // const options: any = {
  //   method: 'GET',
  //   url: `https://${
  //     ctx.vtex.account
  //   }.vtexcommercestable.com.br/api/vtexid/pub/authenticated/user?authToken=${
  //     ctx.vtex.storeUserAuthToken ?? ctx.vtex.authToken
  //   }`,
  //   headers: {
  //     Accept: 'application/json',
  //     'Content-Type': 'application/json',
  //   },
  // }
  // const user = await axios
  //   .request(options)
  //   .then((res) => {
  //     console.log(' user data : ', res.data)

  //     return res.data
  //   })
  //   .catch((err) => {
  //     console.log(' user data error : ', err.data)
  //     console.log(' user data error response : ', err.data.response)
  //     return err.response.data
  //   })
  // console.log('USER', user)
  // if (!user) {
  //   ctx.status = 200
  //   ctx.body = []
  //   return
  // }
  ctx.status = 200
  ctx.body = ''
  return
}
