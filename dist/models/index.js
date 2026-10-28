"use strict";
/**
 * db-manager - Pre-Built Data Models Export
 */
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
__exportStar(require("./base-model"), exports);
// Clinic Models
__exportStar(require("./clinic/patient.model"), exports);
__exportStar(require("./clinic/doctor.model"), exports);
__exportStar(require("./clinic/appointment.model"), exports);
__exportStar(require("./clinic/prescription.model"), exports);
__exportStar(require("./clinic/invoice.model"), exports);
__exportStar(require("./clinic/medical-record.model"), exports);
__exportStar(require("./clinic/clinic.model"), exports);
// Core SaaS Models
__exportStar(require("./core/user.model"), exports);
__exportStar(require("./core/auth-session.model"), exports);
__exportStar(require("./core/activity-log.model"), exports);
__exportStar(require("./core/key-value.model"), exports);
__exportStar(require("./core/generic-document.model"), exports);
//# sourceMappingURL=index.js.map