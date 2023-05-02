import { MasterData } from "@vtex/api";
import { constants } from "../utils/constant";

export async function createDocumentInvoice(
    body: any,
    masterdata: MasterData
  ) {
  
    let result: any = undefined;
    try {
      result = await masterdata.createDocument({
        dataEntity: constants.INVOICE_DATA_ENTITITY_NAME,
        schema: constants.INVOICE_SCHEMA,
        fields: body,
      });
      console.log('Master data ',{result})
    } catch (error) {
      console.error("Issue while creating the Document", error);
      return { isError: true, data: error.response.data };
    }
  
    return result;
  }
  
//   export async function createInvoiceSchema(ctx: any) {
//     const {
//       clients: { apps, masterdata },
//       vtex: { logger },
//     } = ctx;
//     const appSettings = await getAppSettings(apps);
//     console.log({ appSettings });
  
//     let result;
//     let isSchemaPresent = true;
//     try {
//       const schema = await masterdata.getSchema({
//         dataEntity: constants.masterdata.DATA_ENTITY,
//         schema: constants.masterdata.SCHEMA,
//       });
  
//       if (!schema) {
//         isSchemaPresent = false;
//         result = await masterdata.createOrUpdateSchema({
//           dataEntity: constants.masterdata.DATA_ENTITY ?? "checkout",
//           schemaName: constants.masterdata.SCHEMA,
//           schemaBody: constants.masterdata.SCHEMA_BODY,
//         });
//       }
  
//       isSchemaPresent
//         ? logger.info("Schema is already created ---> ", schema)
//         : logger.info("New Schema Created ---> ", result);
  
//       return {
//         isError: false, payload: result
//       };
//     } catch (e) {
//       logger.error("Issue while create or update of schema : ", e.response);
//       if (e.response.status === 304) {
//         return { isError: false, error : e };
//       }
//       return {
//         isError: true,
//         error : e
//       };
//     }
//   }