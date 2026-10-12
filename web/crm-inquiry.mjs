export const crmInquiryConsentVersion = 'crm-inquiry-v1';
export const crmInquiryConsent = {
  en: 'I agree that CNPS may store and process my contact details and inquiry in its customer management system and HubSpot to respond and manage our discussions. This does not subscribe me to marketing.',
  zh: '我同意 CNPS 在客户管理系统及 HubSpot 中保存并处理我的联系方式与询盘，用于回复、客户建档及项目沟通。这不会使我订阅营销信息。',
  ar: 'أوافق على أن تحفظ CNPS بيانات الاتصال والاستفسار وتعالجها في نظام إدارة العملاء وHubSpot للرد وإدارة مناقشاتنا. ولا يُعد ذلك اشتراكاً في الرسائل التسويقية.',
};

export async function submitCrmInquiry(values, tracking, context, {locale = 'en', kind = 'general', fetchImpl = fetch, timeoutMs = 25000} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('/api/crm-inquiry', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', referrerPolicy: 'no-referrer',
      headers: {'Content-Type': 'application/json', 'X-CNPS-CRM': '1'}, signal: controller.signal,
      body: JSON.stringify({values, tracking, context, locale, kind, consentVersion: crmInquiryConsentVersion}),
    });
    const result = await response.json();
    if (!response.ok || result?.ok !== true) throw new Error('inquiry-' + (result?.code || response.status));
    if (result.submitted !== true && result.pending !== true) throw new Error('inquiry-unconfirmed');
    return {submitted: result.submitted === true, pending: result.pending === true};
  } finally {clearTimeout(timer);}
}
