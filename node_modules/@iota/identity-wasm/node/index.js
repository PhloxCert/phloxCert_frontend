"use strict";
// Copyright 2021-2022 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./append_functions.js");
__exportStar(require("./iota_identity_client.js"), exports);
__exportStar(require("./jose"), exports);
__exportStar(require("./jwk_storage"), exports);
__exportStar(require("./key_id_storage"), exports);
__exportStar(require("./identity_wasm.js"), exports);
//# sourceMappingURL=index.js.map