// Proposal access and CRM authenticate through the same SMS account and budget.
// Keep the per-phone allowance identical so one entry point cannot retain an
// older, stricter cap on the shared counter.
export const SMS_PHONE_DAILY_LIMIT = 20;
