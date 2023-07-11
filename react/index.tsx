/* global jsPDF */
import React, { useEffect } from 'react'
// import axios from "axios";
import { BuyerTemplate } from './templates/buyer'
import { SellerTemplate } from './templates/seller'
const styles = require('./index.css')

const invoice = (props) => {
  const ref = React.createRef()
  useEffect(() => {
    injectScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.min.js'
    )
  }, [])

  const injectScript = (src) => {
    const head = document.getElementsByTagName('head')[0]

    const js = document.createElement('script')
    // js.id = id
    js.src = src
    js.async = true
    js.defer = true
    // js.onload = onLoad

    head.appendChild(js)
  }

  const Template =
    props.params.type === 'buyer' ? (
      <BuyerTemplate body={props} />
    ) : (
      <SellerTemplate body={props} />
    )

  return <div className={styles.container}>{Template}</div>
}

export default invoice
