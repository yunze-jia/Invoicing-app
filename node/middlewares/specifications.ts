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
      console.log('Product specifications success - ', res.data)

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

export async function getProductSpecifications(
  productId: string,
  account: string,
  authToken: string
) {
  console.log({ productId, account, authToken })

  const headers = {
    VtexIdclientAutCookie: authToken,
  }
  const productSpecifiations = await axios
    .get(
      `http://whola.vtexcommercestable.com.br/api/catalog_system/pvt/products/${productId}/specification`,
      { headers }
    )
    .then((res) => {
      console.log('Product specifications success - ', res.data)

      return {
        isError: false,
        data: res.data,
      }
    })
    .catch((err) => {
      console.log('Product specifications Faiure - ', err.response.data)
      console.log('Product specifications Faiure Response - ', err.response)
      return {
        isError: true,
        data: err.response.data,
      }
    })

  if (productSpecifiations.isError) return ''
  let wholeSalePrice
  for (let ps of productSpecifiations.data) {
    if (ps.Name === 'whola_wholesale_unit_price') {
      wholeSalePrice = ps.Value.reduce(
        (i: any, val: any) => i + Number(val.split(',').join('.')),
        0
      )
      break
    }
  }

  return wholeSalePrice
}
