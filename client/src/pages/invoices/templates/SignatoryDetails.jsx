import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';

export default function SignatoryDetails({ biz, align = 'center', color = '#1a3a6b', labelStyle = {}, showLabel = true }) {
  const sigImg = biz?.businessSignature || biz?.signature || biz?.signatureImage;
  const signatoryName = String(biz?.signatoryName || '').trim() || String(biz?.name || '').trim();
  const designation = biz?.designation || '';

  return (
    <View style={{ width: 160, alignItems: 'center' }}>
      {sigImg ? (
        <Image
          src={sigImg}
          style={{ width: 140, height: 48, objectFit: 'contain', marginBottom: 4 }}
        />
      ) : (
        <View style={{ height: 36 }} />
      )}
      {showLabel && (
        <Text style={[{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: color || '#333333', textAlign: 'center' }, labelStyle]}>
          Authorized signature
        </Text>
      )}
      {signatoryName ? (
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#222222', textAlign: 'center', marginTop: 2 }} numberOfLines={1}>
          {signatoryName}
        </Text>
      ) : null}
      {designation ? (
        <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica', color: '#555555', textAlign: 'center', marginTop: 1 }} numberOfLines={1}>
          {designation}
        </Text>
      ) : null}
    </View>
  );
}

