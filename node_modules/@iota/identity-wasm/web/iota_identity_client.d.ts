import { IIotaIdentityClient, IotaDID, IotaDocument } from "./identity_wasm.js";
import { Address, AliasOutput, Client, INodeInfoProtocol, IRent, SecretManagerType } from "@iota/sdk-wasm/web";
/** Provides operations for IOTA DID Documents with Alias Outputs. */
export declare class IotaIdentityClient implements IIotaIdentityClient {
    client: Client;
    constructor(client: Client);
    getNetworkHrp(): Promise<string>;
    getAliasOutput(aliasId: string): Promise<[string, AliasOutput]>;
    getRentStructure(): Promise<IRent>;
    getTokenSupply(): Promise<string>;
    getProtocolParameters(): Promise<INodeInfoProtocol>;
    /** Create a DID with a new Alias Output containing the given `document`.
     *
     * The `address` will be set as the state controller and governor unlock conditions.
     * The minimum required token deposit amount will be set according to the given
     * `rent_structure`, which will be fetched from the node if not provided.
     * The returned Alias Output can be further customized before publication, if desired.
     *
     * NOTE: this does *not* publish the Alias Output.
     */
    newDidOutput(address: Address, document: IotaDocument, rentStructure?: IRent): Promise<AliasOutput>;
    /** Fetches the associated Alias Output and updates it with `document` in its state metadata.
     * The storage deposit on the output is left unchanged. If the size of the document increased,
     * the amount should be increased manually.
     *
     * NOTE: this does *not* publish the updated Alias Output.
     */
    updateDidOutput(document: IotaDocument): Promise<AliasOutput>;
    /** Removes the DID document from the state metadata of its Alias Output,
     * effectively deactivating it. The storage deposit on the output is left unchanged,
     * and should be reallocated manually.
     *
     * Deactivating does not destroy the output. Hence, it can be re-activated by publishing
     * an update containing a DID document.
     *
     * NOTE: this does *not* publish the updated Alias Output.
     */
    deactivateDidOutput(did: IotaDID): Promise<AliasOutput>;
    /** Resolve a {@link IotaDocument}. Returns an empty, deactivated document if the state
     * metadata of the Alias Output is empty.
     */
    resolveDid(did: IotaDID): Promise<IotaDocument>;
    /** Fetches the Alias Output associated with the given DID. */
    resolveDidOutput(did: IotaDID): Promise<AliasOutput>;
    /** Publish the given `aliasOutput` with the provided `secretManager`, and returns
     * the DID document extracted from the published block.
     *
     * Note that only the state controller of an Alias Output is allowed to update its state.
     * This will attempt to move tokens to or from the state controller address to match
     * the storage deposit amount specified on `aliasOutput`.
     *
     * This method modifies the on-ledger state.
     */
    publishDidOutput(secretManager: SecretManagerType, aliasOutput: AliasOutput): Promise<IotaDocument>;
    /** Destroy the Alias Output containing the given `did`, sending its tokens to a new Basic Output
     * unlockable by the given address.
     *
     * Note that only the governor of an Alias Output is allowed to destroy it.
     *
     * ### WARNING
     *
     * This destroys the Alias Output and DID document, rendering them permanently unrecoverable.
     */
    deleteDidOutput(secretManager: SecretManagerType, address: Address, did: IotaDID): Promise<void>;
}
