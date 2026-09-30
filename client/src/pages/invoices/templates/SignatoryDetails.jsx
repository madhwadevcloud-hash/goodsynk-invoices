import React from 'react';
import { Text, View } from '@react-pdf/renderer';

export default function SignatoryDetails({ biz }) {
  if (!biz?.signatoryName && !biz?.designation) return null;
  return (
    <View style={{ alignItems: 'flex-end', marginTop: 2 }}>
      {biz.signatoryName && <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{biz.signatoryName}</Text>}
      {biz.designation && <Text style={{ fontSize: 7 }}>{biz.designation}</Text>}
    </View>
  );
}
