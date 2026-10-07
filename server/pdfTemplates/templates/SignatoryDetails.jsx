import React from 'react';
import { Text, View } from '@react-pdf/renderer';

export default function SignatoryDetails({ biz, align }) {
  const alignItems = align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end';
  const textAlign = align === 'center' ? 'center' : align === 'left' ? 'left' : 'right';
  if (!biz?.signatoryName && !biz?.designation) return null;
  return (
    <View style={{ alignItems, marginTop: 2, maxWidth: '100%' }}>
      {biz.signatoryName && <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign }}>{biz.signatoryName}</Text>}
      {biz.designation && <Text style={{ fontSize: 7, textAlign }}>{biz.designation}</Text>}
    </View>
  );
}
