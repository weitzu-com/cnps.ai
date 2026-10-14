// Proposal access and CRM authenticate through the same SMS account and budget.
// Aliyun delivery notifications also consume these counters. Keep every
// consumer aligned so one entry point cannot retain an older, stricter cap.
export const SMS_PHONE_DAILY_LIMIT = 20;
export const SMS_GLOBAL_DAILY_LIMIT = 200;
export const SMS_GLOBAL_MONTHLY_LIMIT = 3000;
