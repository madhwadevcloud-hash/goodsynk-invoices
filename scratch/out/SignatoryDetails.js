import React from "react";
import { Text, View, Image } from "@react-pdf/renderer";
export default function SignatoryDetails({ biz, align = "center", color = "#1a3a6b", labelStyle = {} }) {
  const sigImg = biz?.businessSignature || biz?.signature || biz?.signatureImage;
  const signatoryName = biz?.signatoryName || biz?.name || "";
  const designation = biz?.designation || "";
  return /* @__PURE__ */ React.createElement(View, { style: { width: 160, alignItems: "center" } }, sigImg ? /* @__PURE__ */ React.createElement(
    Image,
    {
      src: sigImg,
      style: { width: 140, height: 48, objectFit: "contain", marginBottom: 4 }
    }
  ) : /* @__PURE__ */ React.createElement(View, { style: { height: 36 } }), /* @__PURE__ */ React.createElement(Text, { style: [{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: color || "#333333", textAlign: "center" }, labelStyle] }, "Authorized signature"), signatoryName ? /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#222222", textAlign: "center", marginTop: 2 }, numberOfLines: 1 }, signatoryName) : null, designation ? /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7.5, fontFamily: "Helvetica", color: "#555555", textAlign: "center", marginTop: 1 }, numberOfLines: 1 }, designation) : null);
}
