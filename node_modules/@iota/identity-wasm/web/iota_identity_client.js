// Copyright 2020-2022 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { IotaDocument, IotaIdentityClientExt } from "./identity_wasm.js";
import { AddressUnlockCondition, OutputType, UTXOInput, } from "@iota/sdk-wasm/web";
/** Provides operations for IOTA DID Documents with Alias Outputs. */
var IotaIdentityClient = /** @class */ (function () {
    function IotaIdentityClient(client) {
        this.client = client;
    }
    IotaIdentityClient.prototype.getNetworkHrp = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getBech32Hrp()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IotaIdentityClient.prototype.getAliasOutput = function (aliasId) {
        return __awaiter(this, void 0, void 0, function () {
            var outputId, outputResponse, output, ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.aliasOutputId(aliasId)];
                    case 1:
                        outputId = _a.sent();
                        return [4 /*yield*/, this.client.getOutput(outputId)];
                    case 2:
                        outputResponse = _a.sent();
                        output = outputResponse.output;
                        if (output.getType() != OutputType.Alias) {
                            throw new Error("AliasId '" + aliasId + "' returned incorrect output type '" + output.getType() + "'");
                        }
                        ret = [outputId, output];
                        return [2 /*return*/, ret];
                }
            });
        });
    };
    IotaIdentityClient.prototype.getRentStructure = function () {
        return __awaiter(this, void 0, void 0, function () {
            var info;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getInfo()];
                    case 1:
                        info = _a.sent();
                        return [2 /*return*/, info.nodeInfo.protocol.rentStructure];
                }
            });
        });
    };
    IotaIdentityClient.prototype.getTokenSupply = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getTokenSupply()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IotaIdentityClient.prototype.getProtocolParameters = function () {
        return __awaiter(this, void 0, void 0, function () {
            var protocolParameters;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.getProtocolParameters()];
                    case 1:
                        protocolParameters = _a.sent();
                        return [2 /*return*/, protocolParameters];
                }
            });
        });
    };
    /** Create a DID with a new Alias Output containing the given `document`.
     *
     * The `address` will be set as the state controller and governor unlock conditions.
     * The minimum required token deposit amount will be set according to the given
     * `rent_structure`, which will be fetched from the node if not provided.
     * The returned Alias Output can be further customized before publication, if desired.
     *
     * NOTE: this does *not* publish the Alias Output.
     */
    IotaIdentityClient.prototype.newDidOutput = function (address, document, rentStructure) {
        return __awaiter(this, void 0, void 0, function () {
            var aliasOutputParams;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, IotaIdentityClientExt.newDidOutput(this, address, document, rentStructure)];
                    case 1:
                        aliasOutputParams = _a.sent();
                        return [4 /*yield*/, this.client.buildAliasOutput(aliasOutputParams)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Fetches the associated Alias Output and updates it with `document` in its state metadata.
     * The storage deposit on the output is left unchanged. If the size of the document increased,
     * the amount should be increased manually.
     *
     * NOTE: this does *not* publish the updated Alias Output.
     */
    IotaIdentityClient.prototype.updateDidOutput = function (document) {
        return __awaiter(this, void 0, void 0, function () {
            var aliasOutputParams;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, IotaIdentityClientExt.updateDidOutput(this, document)];
                    case 1:
                        aliasOutputParams = _a.sent();
                        return [4 /*yield*/, this.client.buildAliasOutput(aliasOutputParams)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Removes the DID document from the state metadata of its Alias Output,
     * effectively deactivating it. The storage deposit on the output is left unchanged,
     * and should be reallocated manually.
     *
     * Deactivating does not destroy the output. Hence, it can be re-activated by publishing
     * an update containing a DID document.
     *
     * NOTE: this does *not* publish the updated Alias Output.
     */
    IotaIdentityClient.prototype.deactivateDidOutput = function (did) {
        return __awaiter(this, void 0, void 0, function () {
            var aliasOutputParams;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, IotaIdentityClientExt.deactivateDidOutput(this, did)];
                    case 1:
                        aliasOutputParams = _a.sent();
                        return [4 /*yield*/, this.client.buildAliasOutput(aliasOutputParams)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Resolve a {@link IotaDocument}. Returns an empty, deactivated document if the state
     * metadata of the Alias Output is empty.
     */
    IotaIdentityClient.prototype.resolveDid = function (did) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, IotaIdentityClientExt.resolveDid(this, did)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Fetches the Alias Output associated with the given DID. */
    IotaIdentityClient.prototype.resolveDidOutput = function (did) {
        return __awaiter(this, void 0, void 0, function () {
            var aliasOutputParams;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, IotaIdentityClientExt.resolveDidOutput(this, did)];
                    case 1:
                        aliasOutputParams = _a.sent();
                        return [4 /*yield*/, this.client.buildAliasOutput(aliasOutputParams)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Publish the given `aliasOutput` with the provided `secretManager`, and returns
     * the DID document extracted from the published block.
     *
     * Note that only the state controller of an Alias Output is allowed to update its state.
     * This will attempt to move tokens to or from the state controller address to match
     * the storage deposit amount specified on `aliasOutput`.
     *
     * This method modifies the on-ledger state.
     */
    IotaIdentityClient.prototype.publishDidOutput = function (secretManager, aliasOutput) {
        return __awaiter(this, void 0, void 0, function () {
            var networkHrp, _a, blockId, block, documents;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getNetworkHrp()];
                    case 1:
                        networkHrp = _b.sent();
                        return [4 /*yield*/, this.client.buildAndPostBlock(secretManager, {
                                outputs: [aliasOutput]
                            })];
                    case 2:
                        _a = _b.sent(), blockId = _a[0], block = _a[1];
                        return [4 /*yield*/, this.client.retryUntilIncluded(blockId)];
                    case 3:
                        _b.sent();
                        documents = IotaDocument.unpackFromBlock(networkHrp, block);
                        if (documents.length < 1) {
                            throw new Error("publishDidOutput: no DID document in transaction payload");
                        }
                        return [2 /*return*/, documents[0]];
                }
            });
        });
    };
    /** Destroy the Alias Output containing the given `did`, sending its tokens to a new Basic Output
     * unlockable by the given address.
     *
     * Note that only the governor of an Alias Output is allowed to destroy it.
     *
     * ### WARNING
     *
     * This destroys the Alias Output and DID document, rendering them permanently unrecoverable.
     */
    IotaIdentityClient.prototype.deleteDidOutput = function (secretManager, address, did) {
        return __awaiter(this, void 0, void 0, function () {
            var networkHrp, aliasId, _a, outputId, aliasOutput, aliasInput, basicOutput, _b, blockId, _block;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getNetworkHrp()];
                    case 1:
                        networkHrp = _c.sent();
                        if (networkHrp !== did.network()) {
                            throw new Error("deleteDidOutput: DID network mismatch, client expected `" + networkHrp + "`, DID network is `"
                                + did.network() + "`");
                        }
                        aliasId = did.tag();
                        return [4 /*yield*/, this.getAliasOutput(aliasId)];
                    case 2:
                        _a = _c.sent(), outputId = _a[0], aliasOutput = _a[1];
                        aliasInput = UTXOInput.fromOutputId(outputId);
                        return [4 /*yield*/, this.client.buildBasicOutput({
                                amount: aliasOutput.getAmount(),
                                nativeTokens: aliasOutput.getNativeTokens(),
                                unlockConditions: [
                                    new AddressUnlockCondition(address),
                                ]
                            })];
                    case 3:
                        basicOutput = _c.sent();
                        return [4 /*yield*/, this.client.buildAndPostBlock(secretManager, {
                                inputs: [aliasInput],
                                outputs: [basicOutput],
                                burn: {
                                    aliases: [aliasId]
                                }
                            })];
                    case 4:
                        _b = _c.sent(), blockId = _b[0], _block = _b[1];
                        return [4 /*yield*/, this.client.retryUntilIncluded(blockId)];
                    case 5:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return IotaIdentityClient;
}());
export { IotaIdentityClient };
//# sourceMappingURL=iota_identity_client.js.map