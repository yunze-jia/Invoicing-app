import axios from 'axios'

export async function getSKUSpecifications(
  skuId: string,
  account: string,
  authToken: string
) {
  console.log({ skuId, account, authToken })

  const headers = {
    VtexIdclientAutCookie: authToken,
  }
  const skuSpecifiations = await axios
    .get(
      `http://${account}.vtexcommercestable.com.br/api/catalog/pvt/stockkeepingunit/${skuId}/specification`,
      { headers }
    )
    .then((res) => {
      console.log('SKU specifications success - ', res.data)

      return {
        isError: false,
        data: res.data,
      }
    })
    .catch((err) => {
      console.log('SKU specifications Faiure - ', err.response.data)
      console.log('SKU specifications Faiure Response - ', err.response)
      return {
        isError: true,
        data: err.response.data,
      }
    })

  if (skuSpecifiations.isError) return ''
  return skuSpecifiations?.data
    ? skuSpecifiations?.data
        .map((res: any) => {
          return res.Text
        })
        .join('-')
    : ''
}
