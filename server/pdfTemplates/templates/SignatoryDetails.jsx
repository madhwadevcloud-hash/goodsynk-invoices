const React = require('react');
const { Text, View } = require('@react-pdf/renderer');

function SignatoryDetails({ biz }) {
  if (!biz?.signatoryName && !biz?.designation) return null;
  return React.createElement(
    View,
    { style: { alignItems: 'flex-end', marginTop: 2 } },
    biz.signatoryName && React.createElement(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold' } }, biz.signatoryName),
    biz.designation && React.createElement(Text, { style: { fontSize: 7 } }, biz.designation)
  );
}

module.exports = SignatoryDetails;
