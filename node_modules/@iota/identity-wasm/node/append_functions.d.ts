import { CoreDID, CoreDocument, IotaDocument, IToCoreDID, IToCoreDocument } from "./identity_wasm.js";
declare type GetCoreDocument = (arg: IToCoreDocument) => CoreDocument;
declare type MaybeGetIotaDocument = (arg: IToCoreDocument) => IotaDocument | void;
declare type GetCoreDidClone = (arg: IToCoreDID) => CoreDID;
declare global {
    var _getCoreDocumentInternal: GetCoreDocument;
    var _maybeGetIotaDocumentInternal: MaybeGetIotaDocument;
    var _getCoreDidCloneInternal: GetCoreDidClone;
}
export {};
