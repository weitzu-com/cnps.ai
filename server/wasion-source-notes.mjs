// Exact-source clarification only. Preserve the publisher's original wording;
// different field names or nominal/rated values are not automatically errors.
const SOURCE_NOTES = new Map([
  ['product-hmpm-for-the-android-platform-to-set-parameters-read-copy-data-from-meters-with-hhu', [{
    sourceURL: 'https://en.wasion.com/RelevantProduct/Wasion-Meterview-APP.html',
    field: 'Key Features / Main Functions — Compatibility',
    quotes: ['Support Android 6.0 and higher versions', 'Android 5.0 and above'],
    message: 'The official page lists Android 6.0 and higher in Key Features, but Android 5.0 and above under Compatibility. Confirm the applicable OS requirement and software version with Wasion before selection.'
  }]],
  ['product-jyl-60-fault-indicator-distribution-line-fault-detectors-technology', [{
    sourceURL: 'https://en.wasion.com/proIntpRel/JYL-60-Fault-Indicator.html',
    field: 'Key Features — Maximum short circuit current / Technical Parameters — Maximum Fault Current',
    quotes: ['Maximum short circuit current: 30kA/2s', '20kA/2s'],
    message: 'Key Features lists Maximum short circuit current as 30kA/2s, while Technical Parameters lists Maximum Fault Current as 20kA/2s. These field labels differ. Ask Wasion to confirm the applicable ratings and test conditions; do not treat them as interchangeable.'
  }]],
  ['product-we-cube-air-cooling-500kw-1000kwh', [{
    sourceURL: 'https://en.wasion.com/EnergyStorageSystem/WE-CUBE.html',
    field: 'Product subtitle / DC Specification — Rated Capacity',
    quotes: ['Air Cooling 500kW / 1000kWh', '1075.2 kWh'],
    message: 'The product subtitle lists 500kW / 1000kWh, while DC Specification gives Rated Capacity as 1075.2 kWh. The headline and rated-capacity figures may use different bases. Ask Wasion to confirm the applicable capacity definition and configuration.'
  }]]
]);

export function getWasionSourceNotes(id) {
  return (SOURCE_NOTES.get(id) || []).map(note => ({ ...note, quotes: [...note.quotes] }));
}
