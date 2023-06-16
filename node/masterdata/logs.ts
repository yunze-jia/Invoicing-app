const DATA_ENTITY = 'vtexasia_logs_test'
const SCHEMA = 'native-invoice-test'

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
      await masterdata.createOrUpdateSchema({
        dataEntity: DATA_ENTITY,
        schemaName: SCHEMA,
        schemaBody: {
          properties: {
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
          'v-indexed': ['skuId'],
          'v-security': {
            allowGetAll: false,
            publicRead: ['id', 'skuId', 'message', 'body'],
            publicWrite: ['skuId', 'message', 'body'],
            publicFilter: ['skuId', 'message', 'body'],
          },
        },
      })
    }

    return {
      isError: false,
    }
  } catch (e) {
    console.log(e.response)
    if (e.response.status === 304) {
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
    skuId: string | null
    message: string | null
    body: string | null
  }
) {
  const {
    clients: { masterdata },
  } = ctx

  console.log('ADD LOG', log)

  const result = await masterdata.createDocument({
    dataEntity: DATA_ENTITY,
    schema: SCHEMA,
    fields: {
      skuId: log.skuId ?? '',
      message: log.message ?? '',
      body: log.body ?? '',
    },
  })

  return result
}
