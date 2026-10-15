/* Reviewed against the captured official model pages, 2026-10-16.
 * Slugs are stable product IDs. Membership never depends on display text or regex.
 * A selection association is not evidence of integration or use in a named project.
 */
const family=(label,catalog,leaves=[])=>Object.freeze({label,catalog,leaves:Object.freeze(leaves)});
export const PRODUCT_FAMILIES=Object.freeze({
 'ameter-100-300-iec':family('aMeter100 / aMeter300 IEC smart-meter family','electricity-meters',['category-ameter100-300-iec']),
 'ameter-151-351':family('aMeter151 / aMeter351 smart-meter family','electricity-meters',['category-ameter151-351-iec']),
 'metering-cabinets':family('Published metering enclosures: Large Power Unit / SMC100','electricity-meters'),
 'ddsd101-kt':family('DDSD101-KT keypad meter','electricity-meters'),
 'libra-c':family('Libra 1C / 3C ANSI meter family','electricity-meters',['category-libra-1c-3c-ansi']),
 'libra-a':family('Libra 1A ANSI conventional meter','electricity-meters',['category-libra-1a-ansi']),
 'dtsy341':family('DTSY341 smart prepayment meter','electricity-meters'),
 'ddsd101-j6':family('DDSD101-J6 smart prepayment meter','electricity-meters',['category-ddsd101-j6']),
 'ddsd101-j7':family('DDSD101-J7 smart prepayment meter','electricity-meters'),
 'dtsd341':family('DTSD341 conventional meter','electricity-meters',['category-dtsd341']),
 'dds102':family('DDS102 conventional meter','electricity-meters',['category-dds102']),
 'cellular-gprs':family('Published cellular / GPRS communication devices','telecommunications',['category-gprs']),
 'cellular-modem':family('DC201 standalone cellular modem','telecommunications'),
 'wisun-router':family('WIR-3000 Wi-SUN router','telecommunications',['category-wir-3000-router']),
 'wisun-gateway':family('WFCT-960 Wi-SUN gateway','telecommunications'),
 'wid2000':family('WID-2000 data concentrator','telecommunications',['category-wid2000-data-concentrator']),
 'g3-plc-module':family('G3-PLC network interface module','telecommunications',['category-g3-plc']),
 'bplc-module':family('BPLC network interface module','telecommunications',['category-bplc']),
 'g3-hybrid-module':family('G3-PLC / RF hybrid module','telecommunications',['category-g3-hybrid']),
 'wired-concentrators':family('WFET1600U / WFCT-980 data concentrators','telecommunications'),
 'ethernet-module':family('Ethernet network interface module','telecommunications'),
 'lorawan-gateway':family('WFCT-950 LoRaWAN gateway','telecommunications'),
 'lorawan-module':family('LoRaWAN network interface module','telecommunications'),
 'wisun-module':family('Wi-SUN RF mesh network interface module','telecommunications',['category-wi-sun']),
 'wisun-repeater':family('DC 210 Wi-SUN FAN data repeater','telecommunications'),
 'rf-p2p':family('RF point-to-point communication devices','telecommunications'),
 'field-deployment':family('Field Deployment Manager','system-software'),
 'pki':family('Public Key Infrastructure management','system-software',['category-public-key-infrastructure']),
 'customer-information':family('Utilities Customer Information Systems','system-software'),
 'head-end':family('Published Head End Systems: UDIS / MDR','system-software',['category-head-end-system']),
 'prepayment-vending':family('Prepayment Vending Management System','system-software',['category-prepayment-vending-management-system']),
 'key-management':family('Key Management System','system-software',['category-key-management-system']),
 'meter-parameters':family('Meter Parameters Management System','system-software'),
 'handheld-app':family('Wasion Meterview Android application','system-software'),
 'meter-data-management':family('Energy Data Integration System / MDMS','system-software'),
 'smart-network-management':family('Smart Network Management System','system-software',['category-smart-network-management-system']),
 'ultrasonic-water':family('Ultrasonic water meters','water-gas-meters',['category-smart-ultrasonic-water-meter']),
 'mechanical-water':family('Mechanical smart water meters: I-110 / C-210','water-gas-meters',['category-smart-mechanical-water']),
 'residential-gas':family('ZG-D residential diaphragm gas meter','water-gas-meters',['category-smart-gas-meters']),
 'automatic-recloser':family('WE-CHZ automatic recloser','digital-grid-distribution-monitoring',['category-auto-recloser-rtu']),
 'fault-indicator':family('JYL-60 distribution-line fault indicator','digital-grid-distribution-monitoring',['category-smart-fault-indicator-ohl-cable']),
 'mv-circuit-breakers':family('Published medium-voltage circuit breakers','digital-grid-distribution-monitoring',['category-intelligent-circuit-breakers-mcb']),
 'ring-main-unit':family('WS-FL-12 ring main unit','digital-grid-distribution-monitoring',['category-smart-rmu']),
 'metal-clad-switchgear':family('KYN28-12 metal-clad switchgear','digital-grid-distribution-monitoring'),
 'miniature-circuit-breakers':family('WS65 / WS65LE miniature circuit breakers','digital-grid-distribution-monitoring',['category-intelligent-circuit-breakers-mcb']),
 'hydrogen-generation':family('R SERIES alkaline hydrogen generation','energy-storage'),
 'portable-power':family('WE PORTABLE STATION portable power','energy-storage'),
 'residential-battery':family('Off-grid residential battery','energy-storage'),
 'residential-inverter':family('Off-grid residential inverter','energy-storage'),
 'residential-stack':family('WE STACK residential storage system','energy-storage'),
 'mobile-storage':family('WE MOBILE storage for vehicle charging','energy-storage'),
 'agricultural-storage':family('WE FARM agricultural energy system','energy-storage'),
 'storage-cabinet':family('WE NODE cabinet-form storage systems','energy-storage',['category-battery-cabinet']),
 'container-storage':family('WE CUBE container-form storage systems','energy-storage',['category-battery-container']),
 'battery-swapping':family('Intelligent battery-swap charging cabinets','energy-storage'),
 'hybrid-pv-inverter':family('WPVI TPH hybrid PV inverter','energy-storage')
});

// Every one of the 86 current model IDs is reviewed explicitly. Empty leaf lists
// mean the model remains in its real portfolio, rather than impersonating a
// requested but undocumented family such as WIMC300 or PCS-Booster equipment.
const assignments=[
 ['ameter300-ctvt-three-phase-smart-energy-meter','ameter-100-300-iec'],
 ['wasion-metering-cabinet-large-power-unit','metering-cabinets'],
 ['ameter100-single-phase-smart-energy-meter','ameter-100-300-iec'],
 ['ameter300-three-phase-smart-energy-meter','ameter-100-300-iec'],
 ['ameter151-single-phase-smart-energy-meter','ameter-151-351'],
 ['ameter351-three-phase-smart-energy-meter','ameter-151-351'],
 ['ameter300-gt-poly-phase-smart-meter','ameter-100-300-iec'],
 ['ameter100-gt-single-phase-smart-meter','ameter-100-300-iec'],
 ['ameter100-kt-single-phase-smart-meter','ameter-100-300-iec'],
 ['ameter300-kt-poly-phase-smart-meter','ameter-100-300-iec'],
 ['ddsd101-kt-single-phase-keypad-meter','ddsd101-kt'],
 ['libra-3c-multi-function-energy-meter','libra-c'],
 ['libra-1c-single-phase-energy-meter','libra-c'],
 ['product-libra-1a-ansi-standard-conventional-meter','libra-a'],
 ['product-dtsy341-three-phase-smart-prepayment-meter','dtsy341'],
 ['product-ddsd101-j6','ddsd101-j6'],
 ['product-ddsd101-j7','ddsd101-j7'],
 ['product-dtsd341-three-phase-energy-meter','dtsd341'],
 ['product-dds102-single-phase-energy-meter','dds102'],
 ['product-ameter300-ct-three-phase-smart-energy-meter','ameter-100-300-iec'],
 ['product-smc100-wasion-cabinet-meters','metering-cabinets'],
 ['product-ameter300-ad1034-three-phase-smart-meter','ameter-100-300-iec'],
 ['product-ameter300-ad0534-200-three-phase-c-smart-meter','ameter-100-300-iec'],
 ['product-ameter300-ac0534-three-phase-c-l-indirect-smart-meter','ameter-100-300-iec'],
 ['product-ameter100-bd-single-two-phase-smart-meter','ameter-100-300-iec'],
 ['product-ameter100-gtru-single-phase-smart-energy-meter','ameter-100-300-iec'],
 ['product-ameter300-gtru-three-phase-smart-energy-meter','ameter-100-300-iec'],
 ['cellular-module','cellular-gprs'],
 ['nb-iot-gprs-network-interface-module','cellular-gprs'],
 ['wir-3000-rf-communication-router','wisun-router'],
 ['wfct-960-wisun-gateway','wisun-gateway'],
 ['product-wid-2000-data-concentrator','wid2000'],
 ['product-g3-plc-network-interface-card-module','g3-plc-module'],
 ['product-bplc-network-interface-card-module','bplc-module'],
 ['product-wfet1600u-data-concentrator-unit','wired-concentrators'],
 ['product-wfct-980-data-concentrator-unit','wired-concentrators'],
 ['product-ethernet-network-interface-card-module','ethernet-module'],
 ['product-hybrid-communication-module','g3-hybrid-module'],
 ['product-dc201-standalone-cellular-modem','cellular-modem'],
 ['product-wfct-950-lorawan-gateway','lorawan-gateway'],
 ['product-lorawan-network-interface-card-module','lorawan-module'],
 ['product-wi-sun-rf-mesh-network-interface-card-module','wisun-module'],
 ['product-dc-210-data-repeater','wisun-repeater'],
 ['product-rf-p2p-dongle','rf-p2p'],
 ['product-rf-lora-p2p','rf-p2p'],
 ['product-rf-fsk-p2p','rf-p2p'],
 ['field-deployment-manager','field-deployment'],
 ['pki-certificate-management-system','pki'],
 ['utilities-customer-information-systems','customer-information'],
 ['universal-device-integration-system','head-end'],
 ['meter-data-reading','head-end'],
 ['prepayment-vending-management-system','prepayment-vending'],
 ['key-management-system','key-management'],
 ['meter-parameters-management-system','meter-parameters'],
 ['product-hmpm-for-the-android-platform-to-set-parameters-read-copy-data-from-meters-with-hhu','handheld-app'],
 ['product-energy-data-integration-system-edis-energy-data-integration-system-mdms','meter-data-management'],
 ['product-snms-smart-network-management-system','smart-network-management'],
 ['lxc-d-ultrasonic-bulk-water-meter','ultrasonic-water'],
 ['lxc-ultrasonic-water-meter','ultrasonic-water'],
 ['i-110-series-smart-water-meter','mechanical-water'],
 ['c-210-series-smart-water-meter','mechanical-water'],
 ['product-d-100-series-ultrasonic-water-meter','ultrasonic-water'],
 ['product-zg-d-1-6-4-smart-residential-gas-meter','residential-gas'],
 ['product-we-chz-27-630-high-voltage-ac-automatic-recloser','automatic-recloser'],
 ['product-jyl-60-fault-indicator-distribution-line-fault-detectors-technology','fault-indicator'],
 ['product-zw32-12-outdoor-high-voltage-smart-vacuum-circuit-breaker','mv-circuit-breakers'],
 ['product-zw20-12-outdoor-high-voltage-smart-vacuum-circuit-breaker','mv-circuit-breakers'],
 ['product-ws-fl-12-sf6-gas-insulated-ring-main-unit','ring-main-unit'],
 ['product-kyn28-12-high-voltage-metal-clad-switchgear','metal-clad-switchgear'],
 ['product-wev-12-indoor-high-voltage-vacuum-circuit-breaker','mv-circuit-breakers'],
 ['product-wev-40-5-indoor-high-voltage-vacuum-circuit-breaker','mv-circuit-breakers'],
 ['product-ws65-63-miniature-circuit-breaker','miniature-circuit-breakers'],
 ['product-ws65le-63-miniature-leakage-circuit-breaker','miniature-circuit-breakers'],
 ['product-r-series-rectangular-stack-alkaline-pro-hydrogen-generation-systems','hydrogen-generation'],
 ['product-we-portable-station','portable-power'],
 ['product-off-grid-residential-battery','residential-battery'],
 ['product-off-grid-residential-inverter','residential-inverter'],
 ['product-we-stack','residential-stack'],
 ['product-we-mobile-liquid-cooling-100kw-215kwh-60kw-129kwh','mobile-storage'],
 ['product-we-farm-air-cooling-250kw-204kwh','agricultural-storage'],
 ['product-we-node-liquid-cooling-100kw-215kwh','storage-cabinet'],
 ['product-we-node-premium-industrial-commercial-energy-storage-system-liquid-cooling-150kw-313kwh-200kw-344kwh','storage-cabinet',['category-c-i-bess']],
 ['product-we-cube-air-cooling-500kw-1000kwh','container-storage'],
 ['product-we-cube-premium-liquid-cooling-1-375mw-2-75mwh-2-5mw-5mwh','container-storage'],
 ['product-intelligent-charging-cabinet','battery-swapping'],
 ['product-wpvi-tph-6000-12000-bh-us-smart-inverter-solution','hybrid-pv-inverter']
];
export const PRODUCT_ASSIGNMENTS=Object.freeze(Object.fromEntries(assignments.map(([id,familyId,extraLeaves=[]])=>[id,Object.freeze({familyId,leafIds:Object.freeze([...PRODUCT_FAMILIES[familyId].leaves,...extraLeaves]),basis:['storage-cabinet','container-storage'].includes(familyId)?'Official model photographs and published housing dimensions establish the physical cabinet / container form. The exact model name and application scope are retained.':'The official model identity, source category and published functional description establish this family. No matching is inferred from incidental words in feature text.'})])));

export const LEAF_CONTENT_GAPS=Object.freeze({
 'category-ameter100-300-eu-iec':'No product source explicitly identifies an aMeter100 / aMeter300 EU variant. European-market aMeter151 / aMeter351 are a different family.',
 'category-ameter100-dt-iec':'No captured official model explicitly names aMeter100 (DT). Other aMeter100 variants are not substituted.',
 'category-cat-1-4-m':'The available cellular sources identify GPRS, 3G, LTE or NB1/NB2. They do not establish the requested CAT-1 / CAT-4 / CAT-M model variants.',
 'category-wid4000-data-concentrator':'A WID4000 model-specific source is not available. WID-2000 and other concentrators are not substituted.',
 'category-burit100':'A BURIT100 model-specific source is not available.',
 'category-wimc300':'A WIMC300 model-specific source is not available. SMC100 and Large Power Unit are separately named models.',
 'category-distribution-transformers':'The official DTECH report mentions distribution transformers, but the reviewed catalogue does not identify a model-specific product.',
 'category-distribution-rtu-iot-edge':'No model-specific distribution RTU / IoT edge product is established in the reviewed source. Communication routers and automatic reclosers are not substituted.',
 'category-transformer-monitoring':'The official TMS page recommends the aMeter300 (CT) and MDR, but does not identify a dedicated transformer-monitoring sensor / hardware SKU. The TMS solution page retains the exact published recommendations; circuit breakers are not substituted.',
 'category-pcs-booster-integrated-equipment':'No captured source establishes a PCS–booster integrated equipment model. Standalone residential / PV inverters are not relabelled as integrated equipment.'
});

// Evidence references point at exact captured fields. They are materialised with
// their literal quote and official source URL by buildSolutionRelations below.
const selected=(id,field,index,reason)=>({id,proof:{field,index},reason,kind:'selection-relevance'});
const feature=(id,index,reason)=>selected(id,'features',index,reason);
const summary=(id,reason)=>selected(id,'summary',null,reason);
const caseLink=(id,reason)=>({id,reason,kind:'published-application-case'});
const ameter=(id,index=0)=>feature(id,index,'Published communication and smart-meter functions support exploration of the AMI field layer. The selected configuration and integration must be confirmed.');
const prepay=(id,index)=>feature(id,index,'The model publishes a prepayment / credit-transfer capability relevant to the prepayment selection path.');
const source=slug=>slug;
export const SOLUTION_RELATION_SPEC=Object.freeze({
 'ami-solution':{source:source('cellular-based-ami-solutions'),sourceField:'paragraphs',sourceIndex:3,products:[
  ameter('ameter300-ctvt-three-phase-smart-energy-meter'),ameter('ameter100-single-phase-smart-energy-meter',3),ameter('ameter300-three-phase-smart-energy-meter',3),ameter('ameter151-single-phase-smart-energy-meter',2),ameter('ameter351-three-phase-smart-energy-meter',1),ameter('ameter300-gt-poly-phase-smart-meter'),ameter('ameter100-gt-single-phase-smart-meter'),ameter('ameter100-kt-single-phase-smart-meter'),ameter('ameter300-kt-poly-phase-smart-meter'),ameter('ddsd101-kt-single-phase-keypad-meter',2),ameter('libra-3c-multi-function-energy-meter',8),ameter('libra-1c-single-phase-energy-meter',5),ameter('product-dtsy341-three-phase-smart-prepayment-meter'),ameter('product-ameter300-ct-three-phase-smart-energy-meter'),ameter('product-smc100-wasion-cabinet-meters',9),ameter('product-ameter300-ad1034-three-phase-smart-meter',4),ameter('product-ameter300-ad0534-200-three-phase-c-smart-meter',3),ameter('product-ameter300-ac0534-three-phase-c-l-indirect-smart-meter',3),ameter('product-ameter100-bd-single-two-phase-smart-meter',3),ameter('product-ameter100-gtru-single-phase-smart-energy-meter',1),ameter('product-ameter300-gtru-three-phase-smart-energy-meter',1),
  feature('cellular-module',5,'Published bidirectional cellular communication is relevant to the cellular AMI communication role.'),feature('nb-iot-gprs-network-interface-module',2,'Published DLMS / ANSI communication is relevant to the cellular metering data path.'),feature('product-dc201-standalone-cellular-modem',1,'Published transparent and DLMS gateway modes support exploration of the AMI communication layer.'),
  feature('product-wid-2000-data-concentrator',1,'Published G3-PLC downlink capability supports a PLC metering-network selection path.'),feature('product-g3-plc-network-interface-card-module',6,'Published meter DLMS interface supports exploration of PLC meter communications.'),feature('product-bplc-network-interface-card-module',7,'The source explicitly names meter reading, billing and line-loss applications.'),feature('product-wfet1600u-data-concentrator-unit',7,'The source describes real-time collection and storage of meter data and events.'),feature('product-wfct-980-data-concentrator-unit',3,'The source describes DLMS uplink / downlink concentrator and gateway functions.'),feature('product-ethernet-network-interface-card-module',4,'Published real-time data collection supports exploration of a wired metering data path.'),feature('product-hybrid-communication-module',0,'Published PLC and RF channels support exploration of hybrid AMI communications.'),feature('wir-3000-rf-communication-router',0,'The source describes integrated FAN / WAN communication, relevant to the field-network architecture.'),feature('wfct-960-wisun-gateway',0,'The source explicitly describes support for smart-meter connections.'),feature('product-wi-sun-rf-mesh-network-interface-card-module',2,'The source describes a self-forming / healing mesh meter network.'),feature('product-dc-210-data-repeater',1,'Published Wi-SUN FAN compliance supports exploration of the FAN network layer.'),feature('product-lorawan-network-interface-card-module',5,'The source explicitly names scheduled and on-demand meter reading.'),
  summary('universal-device-integration-system','The source identifies UDIS as a Head End System; this is a role-based selection association.'),summary('meter-data-reading','The source identifies MDR as a Head End System; no compatibility with a specific model is implied.'),feature('product-energy-data-integration-system-edis-energy-data-integration-system-mdms',5,'The source explicitly describes HES and AMI-system integration.'),feature('product-snms-smart-network-management-system',0,'The source explicitly identifies AMI network equipment management.'),feature('field-deployment-manager',0,'The official product describes deployment / work-order support for smart-meter installation.'),feature('key-management-system',8,'The source names DLMS security-suite standards, relevant to the AMI security role.')
 ],cases:[caseLink('breb-epc-for-ami-project','The official project is explicitly an AMI deployment; it does not identify the individual meter models.'),caseLink('cie-ami-project-in-cote-divoire','The official project describes AMI and G3 / PLC smart prepaid meters, without naming exact models.'),caseLink('cet-ami-project-for-sec','The official project identifies an AMI deployment and three-phase smart meters, without naming exact models.')]},
 'meter-to-cash-solutions':{source:'energy-pro',sourceField:'paragraphs',sourceIndex:2,products:[feature('utilities-customer-information-systems',1,'UCIS explicitly publishes Meter-To-Cash collection and billing functions.'),summary('universal-device-integration-system','HES is a role named in EnergyPro. This separate HES product is a capability-selection reference, not proof that it is an EnergyPro module.'),summary('meter-data-reading','HES is a named role in EnergyPro; the separately published MDR is relevant for selection, without claiming it is the implemented EnergyPro HES.'),summary('product-energy-data-integration-system-edis-energy-data-integration-system-mdms','MDM is named in EnergyPro. EDIS is a separately published MDMS reference, without claiming product integration.'),summary('prepayment-vending-management-system','Vending is named in EnergyPro. PVMS is a separately published product for that function; integration requires confirmation.')],cases:[],caseGap:'No reviewed case identifies an EnergyPro or Meter-to-Cash deployment. Request a reference for this exact solution.'},
 'prepayment-solutions':{source:'prepayment-solutions',sourceField:'paragraphs',sourceIndex:3,products:[prepay('ameter100-kt-single-phase-smart-meter',5),prepay('ameter300-kt-poly-phase-smart-meter',6),prepay('ddsd101-kt-single-phase-keypad-meter',4),prepay('libra-1c-single-phase-energy-meter',2),summary('product-dtsy341-three-phase-smart-prepayment-meter','The official model is explicitly identified as a smart prepayment meter.'),prepay('product-ddsd101-j6',4),prepay('product-ddsd101-j7',3),prepay('product-ameter100-gtru-single-phase-smart-energy-meter',4),prepay('product-ameter300-gtru-three-phase-smart-energy-meter',4),feature('wasion-metering-cabinet-large-power-unit',2,'The official model explicitly supports prepaid and postpaid scenarios.'),summary('prepayment-vending-management-system','The official model identity establishes the vending-management function.'),feature('utilities-customer-information-systems',1,'The official source publishes Meter-To-Cash billing and collection; this is adjacent selection guidance, not proof of a prepayment interface.')],cases:[caseLink('breb-epc-for-ami-project','The official case explicitly reports 500,000 smart prepaid meters, with payment systems.'),caseLink('metering-solutions-for-tanesco','The official case explicitly reports 420,000 single-phase prepaid meters.')]},
 'energy-loss-reduction-solutions':{source:'energy-loss-reduction-solutions',sourceField:'paragraphs',sourceIndex:3,products:[feature('product-energy-data-integration-system-edis-energy-data-integration-system-mdms',3,'The published software explicitly includes multi-dimensional line-loss analysis.'),feature('product-bplc-network-interface-card-module',7,'The source explicitly identifies line-loss analysis among BPLC applications.'),feature('ameter100-single-phase-smart-energy-meter',2,'Published meter event logging is relevant to the evidence-collection layer. It does not prove participation in a specific loss-reduction deployment.'),feature('ameter300-three-phase-smart-energy-meter',2,'Published meter event logging supports exploration of the field-data role.'),feature('ameter300-ctvt-three-phase-smart-energy-meter',7,'The published anti-tamper feature is relevant to loss / revenue-protection selection.'),feature('ameter100-gt-single-phase-smart-meter',5,'The published anti-tamper feature is relevant to loss / revenue-protection selection.'),feature('ameter300-gt-poly-phase-smart-meter',7,'The published anti-tamper feature is relevant to loss / revenue-protection selection.')],cases:[caseLink('cie-ami-project-in-cote-divoire','The official case explicitly reports reductions in electricity theft and improved revenue; exact model IDs are not named.')]},
 'centralised-metering':{source:'cluster-metering-solutions',sourceField:'paragraphs',sourceIndex:2,products:[feature('product-smc100-wasion-cabinet-meters',0,'The source publishes multiple meter connections in one SMC100 cabinet, relevant to the centralised metering selection path. It is not renamed WIMC300 or claimed to be the exact cluster-solution enclosure.')],cases:[],caseGap:'No reviewed project explicitly identifies the centralised / cluster metering configuration. Request a configuration-specific case.'},
 'large-power-user-metering':{source:'cluster-metering-solutions',sourceField:'paragraphs',sourceIndex:3,products:[feature('ameter300-ctvt-three-phase-smart-energy-meter',2,'The source explicitly supports current-transformer metering, relevant to high-value / indirect measurement.'),feature('product-ameter300-ct-three-phase-smart-energy-meter',2,'The source explicitly supports current-transformer measurement.'),feature('product-ameter300-ac0534-three-phase-c-l-indirect-smart-meter',0,'The source explicitly identifies three-phase indirect CT / CT-PT connection.'),feature('wasion-metering-cabinet-large-power-unit',0,'The official Large Power Unit combines CT, meter, communication and installation components.')],cases:[],caseGap:'The reviewed cases do not name a large-power-user / CT metering configuration or its exact models.'},
 'smart-mv-distribution-solution':{source:'intelligent-power-distribution',sourceField:'summary',products:[summary('product-we-chz-27-630-high-voltage-ac-automatic-recloser','The official source identifies an HV automatic recloser; the product page defines its actual protection and control functions.'),summary('product-jyl-60-fault-indicator-distribution-line-fault-detectors-technology','The official product identifies distribution-line fault detection.'),summary('product-zw32-12-outdoor-high-voltage-smart-vacuum-circuit-breaker','The official product is an outdoor HV circuit breaker, relevant to the distribution-equipment portfolio.'),summary('product-zw20-12-outdoor-high-voltage-smart-vacuum-circuit-breaker','The official product is an outdoor HV circuit breaker.'),summary('product-ws-fl-12-sf6-gas-insulated-ring-main-unit','The official product explicitly identifies a ring main unit.'),summary('product-kyn28-12-high-voltage-metal-clad-switchgear','The official product explicitly identifies HV metal-clad switchgear.'),summary('product-wev-12-indoor-high-voltage-vacuum-circuit-breaker','The official product is an indoor HV vacuum circuit breaker.'),summary('product-wev-40-5-indoor-high-voltage-vacuum-circuit-breaker','The official product is an indoor HV vacuum circuit breaker.')],cases:[],caseGap:'No reviewed project establishes a Smart MV Distribution deployment. The AMI cases are not substituted as distribution-automation evidence.'},
 'tms-transformer-monitoring-system':{source:'tms-transformer-monitoring-system',sourceField:'paragraphs',sourceIndex:3,products:[],cases:[],productGap:'The official TMS description does not name its monitoring hardware. Request the transformer-monitoring model, sensors and system specification; unrelated breakers and routers are not substituted.',caseGap:'No reviewed case explicitly names the Transformer Monitoring System. Request a TMS-specific reference.'},
 'power-plant-side-solution':{source:'renewable-energy',sourceField:'summary',products:[],cases:[caseLink('agricultural-pv-and-energy-storage-complementary-project','The official case identifies 60 MW PV and 15 MW / 30 MWh storage, supporting the generation-plus-storage application context. It does not name equipment models.')],productGap:'The reviewed material does not confirm a plant-side equipment lineup or PCS–booster model. Request the plant-side design and model selection.'},
 'power-grid-side-solution':{source:'renewable-energy',sourceField:'summary',products:[],cases:[],productGap:'The reviewed sources do not establish which model is selected for a grid-side project. Request the network duty, grid interface and model-specific selection.',caseGap:'No reviewed project explicitly establishes a grid-side storage deployment. PV-plant and off-grid microgrid cases are not relabelled as grid-side references.'},
 'microgrid-solution':{source:'renewable-energy',sourceField:'summary',products:[feature('product-off-grid-residential-battery',4,'The source explicitly describes parallel / off-grid use and emergency supply; this is a small-system selection reference, not the Qinghai project battery.'),feature('product-off-grid-residential-inverter',4,'The source explicitly describes parallel / off-grid use for small and medium systems. It is not labelled PCS–booster integrated equipment.'),feature('product-we-stack',4,'The source explicitly describes parallel / off-grid use for a small-system selection context.'),feature('product-we-farm-air-cooling-250kw-204kwh',3,'The source explicitly describes rural energy self-sufficiency, relevant to a local-energy selection discussion.')],cases:[caseLink('the-intelligent-microgrid-energy-station-project','The official case explicitly describes off-grid generation–network–load–storage integration for conservation stations. No exact product models are named.')]},
 'ci-bess-solutions':{source:'renewable-energy',sourceField:'summary',products:[summary('product-we-node-premium-industrial-commercial-energy-storage-system-liquid-cooling-150kw-313kwh-200kw-344kwh','The official product summary explicitly identifies an Industrial & Commercial Energy Storage System.')],cases:[],caseGap:'No reviewed case explicitly identifies a commercial / industrial behind-the-meter BESS. The agricultural PV plant is not relabelled as a C&I site.'},
 'smart-water-metering-solutions':{source:'walk-drive-by-solutions',sourceField:'paragraphs',sourceIndex:2,products:[feature('lxc-d-ultrasonic-bulk-water-meter',5,'The official water-meter source explicitly states AMR / AMI. The selected communication and collection configuration must be confirmed.'),feature('lxc-ultrasonic-water-meter',5,'The official water-meter source publishes wired or wireless communication.'),feature('i-110-series-smart-water-meter',8,'The official water-meter source explicitly publishes AMR / AMI options.'),feature('c-210-series-smart-water-meter',7,'The official water-meter source explicitly publishes AMR / AMI options.'),feature('product-d-100-series-ultrasonic-water-meter',8,'The official water-meter source explicitly publishes AMR / AMI options.')],cases:[],caseGap:'No reviewed project is a water-meter deployment. Electricity-meter cases are not substituted.'},
 'smart-gas-metering-solutions':{source:'water-gas-meters',sourceField:'summary',products:[feature('product-zg-d-1-6-4-smart-residential-gas-meter',8,'The official ZG-D source identifies a diaphragm gas meter with wired or wireless communication. Collection compatibility must be confirmed for the selected configuration.')],cases:[],caseGap:'No reviewed project is a gas-meter deployment. Water and electricity cases are not substituted.'}
});

function quoteAt(record,field,index){const value=index==null?record?.[field]:record?.[field]?.[index];if(typeof value!=='string'||!value.trim())throw new Error(`Missing reviewed evidence field ${record?.slug||record?.url}: ${field}[${index}]`);return value;}
const officialSolutionSources={
 'ami-solution':'https://en.wasion.com/soluPage/1.html',
 'meter-to-cash-solutions':'https://en.wasion.com/soluPage/Energy-Pro.html',
 'prepayment-solutions':'https://en.wasion.com/soluPage/7.html',
 'energy-loss-reduction-solutions':'https://en.wasion.com/soluPage/5.html',
 'centralised-metering':'https://en.wasion.com/soluPage/3.html',
 'tms-transformer-monitoring-system':'https://en.wasion.com/soluPage/6.html'
};
export function buildOfficialSourceRelations(products,evidence){
 const byURL=new Map(products.map(p=>[p.url,p]));
 return Object.fromEntries((evidence.solutionRelatedProducts||[]).map(module=>[module.sourceURL,module.relatedProducts.map(item=>{
  const product=byURL.get(item.sourceURL);
  return {id:product?.id||null,url:item.sourceURL,title:product?.title||item.title,kind:'official-related-product',reason:`The official solution page lists ${item.title} in its Related Products module. This establishes a publisher recommendation, not a deployment or integration claim.`,evidence:[{url:module.sourceURL,quote:`Related Products: ${item.title}`,sourceHTMLSha256:module.sourceHTMLSha256},{url:item.sourceURL,quote:item.subtitle||item.title}]};
 })]));
}
export function buildSolutionRelations(products,pages,officialEvidence={}){
 const byId=new Map(products.map(p=>[p.slug,p])),byPage=new Map(pages.map(p=>[p.slug,p]));
 const officialSources=buildOfficialSourceRelations(products,officialEvidence);
 return Object.fromEntries(Object.entries(SOLUTION_RELATION_SPEC).map(([solutionId,spec])=>{
  const official=byPage.get(spec.source);if(!official)throw new Error(`Unknown solution evidence source: ${spec.source}`);
  const solutionEvidence={url:official.url,quote:quoteAt(official,spec.sourceField,spec.sourceIndex)};
  const selections=spec.products.map(edge=>{const product=byId.get(edge.id);if(!product)throw new Error(`Unknown reviewed product: ${edge.id}`);return {...edge,solutionId,evidence:[{url:product.url,quote:quoteAt(product,edge.proof.field,edge.proof.index)},solutionEvidence]};});
  const published=(officialSources[officialSolutionSources[solutionId]]||[]).map(edge=>({...edge,solutionId}));
  const officialOnly=['centralised-metering','tms-transformer-monitoring-system'].includes(solutionId);
  const productRelations=[...new Map([...published.filter(r=>r.id),...(officialOnly?[]:selections)].map(r=>[r.id,r])).values()].map(r=>published.find(edge=>edge.id===r.id)||r);
  const externalProductRelations=published.filter(r=>!r.id);
  const caseRelations=spec.cases.map(edge=>{const item=byPage.get(edge.id);if(!item)throw new Error(`Unknown reviewed case: ${edge.id}`);return {...edge,solutionId,evidence:[{url:item.url,quote:quoteAt(item,'paragraphs',2)}]};});
  return [solutionId,{productRelations,externalProductRelations,caseRelations,productGap:productRelations.length||externalProductRelations.length?'':spec.productGap||'',caseGap:spec.caseGap||''}];
 }));
}

// Exact model-level project evidence is absent in the current seven published
// cases. Do not infer installed models by propagating solution-case relations.
export const PRODUCT_CASE_RELATIONS=Object.freeze({});

// Comparison groups are intentionally narrower than the top-level portfolio.
// A shared interface, integration or interchangeable rating is never asserted.
const comparisonGroups=[
 ['aMeter100 / aMeter300 base IEC family; compare phase and installation configuration.',['ameter100-single-phase-smart-energy-meter','ameter300-three-phase-smart-energy-meter']],
 ['aMeter151 / aMeter351 family; compare single-phase and three-phase models.',['ameter151-single-phase-smart-energy-meter','ameter351-three-phase-smart-energy-meter']],
 ['Published aMeter direct / transformer-connected variants; compare the exact phase, accuracy and installation configuration.',['ameter100-gt-single-phase-smart-meter','ameter300-gt-poly-phase-smart-meter','product-ameter300-ct-three-phase-smart-energy-meter','ameter300-ctvt-three-phase-smart-energy-meter']],
 ['aMeter KT prepayment family; compare the published phase configuration.',['ameter100-kt-single-phase-smart-meter','ameter300-kt-poly-phase-smart-meter']],
 ['aMeter GTRU family; compare single-phase and three-phase models.',['product-ameter100-gtru-single-phase-smart-energy-meter','product-ameter300-gtru-three-phase-smart-energy-meter']],
 ['Published aMeter Brazil-market variants; compare connection, current and tariff configuration.',['product-ameter300-ad1034-three-phase-smart-meter','product-ameter300-ad0534-200-three-phase-c-smart-meter','product-ameter300-ac0534-three-phase-c-l-indirect-smart-meter','product-ameter100-bd-single-two-phase-smart-meter']],
 ['Libra C ANSI smart-meter family; compare the actual form and phase configuration.',['libra-1c-single-phase-energy-meter','libra-3c-multi-function-energy-meter']],
 ['I-110 / C-210 mechanical smart-water-meter family; compare nominal diameter and valve configuration.',['i-110-series-smart-water-meter','c-210-series-smart-water-meter']],
 ['Published ultrasonic water-meter family; compare residential / bulk range and nominal diameter.',['lxc-ultrasonic-water-meter','lxc-d-ultrasonic-bulk-water-meter','product-d-100-series-ultrasonic-water-meter']],
 ['Published outdoor HV vacuum-breaker family; compare the exact protection and installation requirements.',['product-zw32-12-outdoor-high-voltage-smart-vacuum-circuit-breaker','product-zw20-12-outdoor-high-voltage-smart-vacuum-circuit-breaker']],
 ['Published indoor HV vacuum-breaker family; compare the specific voltage class.',['product-wev-12-indoor-high-voltage-vacuum-circuit-breaker','product-wev-40-5-indoor-high-voltage-vacuum-circuit-breaker']],
 ['WS65 miniature-breaker family; compare ordinary and leakage-protection configurations.',['product-ws65-63-miniature-circuit-breaker','product-ws65le-63-miniature-leakage-circuit-breaker']],
 ['WE NODE cabinet-form storage family; compare the exact capacity, PCS and installation requirements.',['product-we-node-liquid-cooling-100kw-215kwh','product-we-node-premium-industrial-commercial-energy-storage-system-liquid-cooling-150kw-313kwh-200kw-344kwh']],
 ['WE CUBE container-form storage family; compare the published capacity and cooling configurations.',['product-we-cube-air-cooling-500kw-1000kwh','product-we-cube-premium-liquid-cooling-1-375mw-2-75mwh-2-5mw-5mwh']]
];
export const PRODUCT_COMPARISONS=Object.freeze(Object.fromEntries(comparisonGroups.flatMap(([reason,ids])=>ids.map(id=>[id,Object.freeze({reason,ids:Object.freeze(ids.filter(other=>other!==id)),kind:'same-published-family-comparison'})]))));
