// To handle codes tables such as SuspensionReasonCode, etc
export interface Code {
    code?: string;
    description?: string;
}

export interface PaymentMethod {
    code: string;
    description: string;
    partialRefund?: boolean;
    refundableStatuses?: string;
}
