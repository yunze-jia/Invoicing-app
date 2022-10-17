📢 Use this project, [contribute](https://github.com/vtex-apps/native-invoicing-app) to it or open issues to help evolve it using [Store Discussion](https://github.com/vtex-apps/store-discussion).

# Native Invoicing

The Native Invoicing app allows sellers to send out VAT-compliant invoices to their customers in a fast and easy way.

![Getting Started](NI.png)

## Installation

Install `vtexasia.native-invoice-app` in your account.

    ```powershell
                    
                    vtex install vtexasia.native-invoicing-app@1.x  

    ``` 


## Configuration

Follow the instructions provided by the Native Invoicing App in the `Admin > Account Seetings > Apps > My Apps > native invoicing app`.

![Getting Started](setting.png)

After the set up, you need to create a hook to listen the payment status. Make a GET request to following endpoint.

https://${workspace}--vtexasia.myvtex.com/_v/orderhooks/create


>ℹ️ **Note**
>${workspace} - current workspace in which you have installed the app.
>"master" for production


Also, install the `vtexasia.native-invoice-app-theme` , this works for the Native Invoicing app theme.

    ```powershell
                    
                    vtex install vtexasia.native-invoice-app-theme@0.x

    ``` 

## App functionality

There are three types of recipients who are sent invoices by the app: marketplace administrators, sellers, and buyers. The app will be trigger upon `Invoice sent` status.

| Receiver | Triggers |
| --- | --- |
| Marketplace admin | Receive all the invoice copies for the seller and buyer |
| Seller | Receive the invoice for sold products |
| Buyer | Receive the invoice for bought products |