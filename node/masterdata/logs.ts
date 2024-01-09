const DATA_ENTITY = 'vtexasia_logs_test'
const SCHEMA = 'native-invoice'

export async function createLogsSchema(ctx: any) {
  const {
    clients: { masterdata },
  } = ctx

  try {
    const schema = await masterdata.getSchema({
      dataEntity: DATA_ENTITY,
      schema: SCHEMA,
    })
    console.log('SCHEMA NIA - ', { schema })

    // addLog(ctx, {
    //   skuId: null,
    //   message: "SCHEMA CREATION - LOGS",
    //   body: JSON.stringify('test'),
    // });

    if (!schema) {
      console.log('Schema creation');
      
      await masterdata.createOrUpdateSchema({
        dataEntity: DATA_ENTITY,
        schemaName: SCHEMA,
        schemaBody: {
          properties: {
            orderId:{
              type: 'string',
              title: 'Order Id',
            },
            invoiceId:{
              type: 'string',
              title: 'Invoice Id',
            },
            skuId: {
              type: 'string',
              title: 'Vtex SKU Id',
            },
            message: {
              type: 'string',
              title: 'Message',
            },
            body: {
              type: 'string',
              title: 'Body',
            },
          },
          'v-indexed': ['skuId','orderId','invoiceId'],
          'v-security': {
            allowGetAll: false,
            publicRead: ['id', 'orderId', 'skuId','invoiceId', 'message', 'body'],
            publicWrite: ['orderId', 'skuId', 'invoiceId', 'message', 'body'],
            publicFilter: ['orderId', 'skuId', 'invoiceId', 'message', 'body'],
          },
        },
      })
    }

    return {
      isError: false,
    }
  } catch (e) {
    console.log(e.response)
    if (e?.response?.status === 304) {
      return { isError: false }
    }
    return {
      isError: true,
    }
  }
}

export async function addLog(
  ctx: any,
  log: {
    invoiceId: string | null
    skuId: string | null,
    orderId: string | null
    message: string | null
    body: string | null
  }
) {
  const {
    clients: { masterdata },
  } = ctx

  // console.log('ADD LOG', log)

  const result = await masterdata.createDocument({
    dataEntity: DATA_ENTITY,
    schema: SCHEMA,
    fields: {
      skuId: log.skuId ?? '',
      message: log.message ?? '',
      body: log.body ?? '',
      orderId: log.orderId ?? '',
      invoiceId: log.invoiceId ?? ''
    },
  })

  return result
}
