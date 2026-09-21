const React = require('react');
const { pdf } = require('@react-pdf/renderer');

const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');

const TemplateResolver =
    require('../pdfTemplates/templates/TemplateResolver.jsx').default;


/*
|--------------------------------------------------------------------------
| BUILD PDF DATA
|--------------------------------------------------------------------------
|
| Database:
|   item.price  = base/unit price
|   item.total  = final line total
|
| Some templates may use:
|   item.price
|   item.rate
|   item.amount
|   item.total
|
| We normalize these values here so the server always receives
| the correct values from MongoDB.
|
| IMPORTANT:
| item.amount MUST NOT be item.total.
|
| Example:
|
| price    = 80,000
| quantity = 1
| tax      = 18%
| total    = 94,400
|
| For the Amount/Unit Price field:
|   price  = 80,000
|
| For the final line total:
|   total  = 94,400
|--------------------------------------------------------------------------
*/

const buildInvoiceForPDF = (doc, docLabel) => {
    const raw = doc.toObject();

    const normalizedItems = (raw.items || []).map((item) => {

        /*
        |--------------------------------------------------------------------------
        | PRICE
        |--------------------------------------------------------------------------
        |
        | MongoDB's canonical field is item.price.
        |
        | DO NOT replace this with item.total.
        */
        const price =
            Number(
                item.price ??
                item.rate ??
                0
            ) || 0;


        /*
        |--------------------------------------------------------------------------
        | QUANTITY
        |--------------------------------------------------------------------------
        */
        const quantity =
            Number(
                item.quantity ??
                1
            ) || 1;


        /*
        |--------------------------------------------------------------------------
        | RATE
        |--------------------------------------------------------------------------
        |
        | Some templates use item.rate.
        | Keep it synchronized with item.price.
        */
        const rate =
            Number(
                item.price ??
                item.rate ??
                0
            ) || 0;


        /*
        |--------------------------------------------------------------------------
        | AMOUNT
        |--------------------------------------------------------------------------
        |
        | Amount is the pre-tax item amount.
        |
        | Example:
        |
        | price    = 80,000
        | quantity = 1
        |
        | amount   = 80,000
        |
        | NOT:
        |
        | amount = 94,400
        |
        | because 94,400 is the tax-inclusive total.
        */
        const amount =
            Number(
                item.amount ??
                (price * quantity)
            ) || 0;


        /*
        |--------------------------------------------------------------------------
        | TOTAL
        |--------------------------------------------------------------------------
        |
        | Keep the database's final line total untouched.
        */
        const total =
            Number(
                item.total ??
                amount
            ) || 0;


        return {
            ...item,

            /*
            |--------------------------------------------------------------------------
            | Canonical values
            |--------------------------------------------------------------------------
            */
            price,
            quantity,

            /*
            |--------------------------------------------------------------------------
            | Compatibility fields
            |--------------------------------------------------------------------------
            */
            rate,
            amount,

            /*
            |--------------------------------------------------------------------------
            | Final line total
            |--------------------------------------------------------------------------
            */
            total,
        };
    });


    /*
    |--------------------------------------------------------------------------
    | DOCUMENT TYPE
    |--------------------------------------------------------------------------
    */
    const isQuotation =
        docLabel.toLowerCase() === 'quotation';


    /*
    |--------------------------------------------------------------------------
    | TEMPLATE
    |--------------------------------------------------------------------------
    |
    | First use the template saved on the document.
    | Otherwise use the user's default template.
    */
    const template =
        raw.template ||
        (
            isQuotation
                ? raw.user?.quotationTemplate
                : raw.user?.invoiceTemplate
        ) ||
        'template1';


    /*
    |--------------------------------------------------------------------------
    | TEMPLATE COLORS
    |--------------------------------------------------------------------------
    */
    const templateColors =
        raw.templateColors ||
        (
            isQuotation
                ? raw.user?.quotationTemplateColors
                : raw.user?.invoiceTemplateColors
        ) ||
        {};


    /*
    |--------------------------------------------------------------------------
    | FINAL PDF OBJECT
    |--------------------------------------------------------------------------
    */
    return {
        ...raw,

        /*
        |--------------------------------------------------------------------------
        | Normalized items
        |--------------------------------------------------------------------------
        */
        items: normalizedItems,

        /*
        |--------------------------------------------------------------------------
        | Document type
        |--------------------------------------------------------------------------
        */
        invoiceType:
            docLabel.toLowerCase(),

        /*
        |--------------------------------------------------------------------------
        | Currency
        |--------------------------------------------------------------------------
        */
        _currency:
            doc.currency || 'INR',

        /*
        |--------------------------------------------------------------------------
        | Tax type
        |--------------------------------------------------------------------------
        */
        _taxType:
            doc.taxType,

        /*
        |--------------------------------------------------------------------------
        | Template
        |--------------------------------------------------------------------------
        */
        template,

        /*
        |--------------------------------------------------------------------------
        | Template colors
        |--------------------------------------------------------------------------
        */
        templateColors,
    };
};


/*
|--------------------------------------------------------------------------
| APPLY DOCUMENT SETTINGS
|--------------------------------------------------------------------------
|
| This mirrors the frontend document settings logic for:
|
| - Discount visibility
| - Watermark
|
|--------------------------------------------------------------------------
*/

const applyDocumentSettings = (
    invoiceForPDF,
    documentSettings
) => {

    const settings =
        documentSettings || {};


    /*
    |--------------------------------------------------------------------------
    | DISCOUNT COLUMN VISIBILITY
    |--------------------------------------------------------------------------
    */
    const isDiscColumnVisible =
        !settings.hideDiscount &&
        settings.showDiscountColumn !== false;


    /*
    |--------------------------------------------------------------------------
    | BASE PROCESSED DOCUMENT
    |--------------------------------------------------------------------------
    */
    let processed = {
        ...invoiceForPDF,

        watermarkImage:
            invoiceForPDF.watermarkImage ||
            settings.watermarkImage ||
            undefined,
    };


    /*
    |--------------------------------------------------------------------------
    | HIDE DISCOUNT
    |--------------------------------------------------------------------------
    |
    | If the user has disabled the discount column,
    | remove discount values from the PDF data.
    */
    if (!isDiscColumnVisible) {

        processed = {
            ...processed,

            discountAmount: 0,

            itemDiscount: 0,

            overallDiscTotal: 0,

            hideDiscount: true,

            hideDiscountColumn: true,

            items:
                processed.items?.map((item) => ({
                    ...item,

                    discount: 0,

                    discountAmount: 0,
                })),
        };
    }


    return processed;
};


/*
|--------------------------------------------------------------------------
| STREAM TO BUFFER
|--------------------------------------------------------------------------
|
| @react-pdf/renderer v4 returns a readable stream from toBuffer().
| We collect that stream into a Buffer before sending it to the browser.
|--------------------------------------------------------------------------
*/

const streamToBuffer = (stream) =>
    new Promise((resolve, reject) => {

        const chunks = [];


        stream.on(
            'data',
            (chunk) => {
                chunks.push(chunk);
            }
        );


        stream.on(
            'end',
            () => {
                resolve(
                    Buffer.concat(chunks)
                );
            }
        );


        stream.on(
            'error',
            reject
        );
    });


/*
|--------------------------------------------------------------------------
| GENERATE PUBLIC PDF
|--------------------------------------------------------------------------
|
| This route is still available for compatibility.
|
| The public page can use the JSON endpoint and client-side TemplateResolver
| for an identical PDF to the normal website.
|
| If another part of your application calls:
|
|   /public/invoice/:token/pdf
|
| this endpoint will still generate a PDF using the normalized database data.
|--------------------------------------------------------------------------
*/

const streamDocumentPdf = async (
    req,
    res,
    {
        Model,
        docLabel,
        numberField,
    }
) => {

    try {

        /*
        |--------------------------------------------------------------------------
        | FIND DOCUMENT
        |--------------------------------------------------------------------------
        */
        const doc =
            await Model.findOne({
                shareToken:
                    req.params.token,

                isDeleted: {
                    $ne: true,
                },
            })


            /*
            |--------------------------------------------------------------------------
            | CLIENT
            |--------------------------------------------------------------------------
            */
            .populate('client')


            /*
            |--------------------------------------------------------------------------
            | USER / BUSINESS
            |--------------------------------------------------------------------------
            */
            .populate(
                'user',
                `
                name
                email
                businessName
                businessLogo
                businessSignature
                businessSeal
                address
                gstin
                phone
                pan
                signatoryName
                designation
                bankDetails
                invoiceTemplate
                invoiceTemplateColors
                quotationTemplate
                quotationTemplateColors
                plan
                documentSettings
                `
            );


        /*
        |--------------------------------------------------------------------------
        | DOCUMENT NOT FOUND
        |--------------------------------------------------------------------------
        */
        if (!doc) {

            return res
                .status(404)
                .send(
                    'Document not found or link expired'
                );
        }


        /*
        |--------------------------------------------------------------------------
        | BUILD NORMALIZED PDF DATA
        |--------------------------------------------------------------------------
        */
        let invoiceForPDF =
            buildInvoiceForPDF(
                doc,
                docLabel
            );


        /*
        |--------------------------------------------------------------------------
        | APPLY DOCUMENT SETTINGS
        |--------------------------------------------------------------------------
        */
        invoiceForPDF =
            applyDocumentSettings(
                invoiceForPDF,
                doc.user?.documentSettings
            );


        /*
        |--------------------------------------------------------------------------
        | GENERATE PDF
        |--------------------------------------------------------------------------
        */
        const pdfStream =
            await pdf(
                React.createElement(
                    TemplateResolver,
                    {
                        invoice:
                            invoiceForPDF,
                    }
                )
            ).toBuffer();


        /*
        |--------------------------------------------------------------------------
        | CONVERT STREAM TO BUFFER
        |--------------------------------------------------------------------------
        */
        const buffer =
            await streamToBuffer(
                pdfStream
            );


        /*
        |--------------------------------------------------------------------------
        | RESPONSE HEADERS
        |--------------------------------------------------------------------------
        */
        res.setHeader(
            'Content-Type',
            'application/pdf'
        );


        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${docLabel}-${doc[numberField]}.pdf"`
        );


        res.setHeader(
            'Content-Length',
            buffer.length
        );


        /*
        |--------------------------------------------------------------------------
        | SEND PDF
        |--------------------------------------------------------------------------
        */
        res.send(buffer);

    } catch (err) {

        console.error(
            `Public ${docLabel} PDF error:`,
            err
        );


        res
            .status(500)
            .send(
                'Failed to generate PDF'
            );
    }
};


/*
|--------------------------------------------------------------------------
| PUBLIC DOCUMENT JSON
|--------------------------------------------------------------------------
|
| This endpoint is used by PublicDocumentView.jsx.
|
| The document is loaded from MongoDB using the shareToken.
|
| The response contains the complete document information required
| by the client-side PDF renderer.
|--------------------------------------------------------------------------
*/

const getPublicDocument = async (
    req,
    res,
    {
        Model,
        docLabel,
        numberField,
        dueDateField,
    }
) => {

    try {

        /*
        |--------------------------------------------------------------------------
        | FIND DOCUMENT
        |--------------------------------------------------------------------------
        */
        const doc =
            await Model.findOne({
                shareToken:
                    req.params.token,

                isDeleted: {
                    $ne: true,
                },
            })


            /*
            |--------------------------------------------------------------------------
            | CLIENT
            |--------------------------------------------------------------------------
            */
            .populate(
                'client',
                'name email phone address gstin'
            )


            /*
            |--------------------------------------------------------------------------
            | USER / BUSINESS
            |--------------------------------------------------------------------------
            */
            .populate(
                'user',
                `
                name
                email
                businessName
                businessLogo
                businessSignature
                businessSeal
                address
                gstin
                phone
                pan
                signatoryName
                designation
                bankDetails
                invoiceTemplate
                invoiceTemplateColors
                quotationTemplate
                quotationTemplateColors
                plan
                documentSettings
                `
            );


        /*
        |--------------------------------------------------------------------------
        | DOCUMENT NOT FOUND
        |--------------------------------------------------------------------------
        */
        if (!doc) {

            return res
                .status(404)
                .json({
                    success: false,

                    message:
                        'Document not found or link expired',
                });
        }


        /*
        |--------------------------------------------------------------------------
        | CONVERT MONGOOSE DOCUMENT
        |--------------------------------------------------------------------------
        */
        const out =
            doc.toObject();


        /*
        |--------------------------------------------------------------------------
        | NORMALIZE ITEMS
        |--------------------------------------------------------------------------
        |
        | This is important because the public page and PDF renderer
        | must receive the same price information.
        |--------------------------------------------------------------------------
        */

        const normalizedItems =
            (out.items || []).map(
                (item) => {

                    /*
                    |--------------------------------------------------------------------------
                    | PRICE
                    |--------------------------------------------------------------------------
                    */
                    const price =
                        Number(
                            item.price ??
                            item.rate ??
                            0
                        ) || 0;


                    /*
                    |--------------------------------------------------------------------------
                    | QUANTITY
                    |--------------------------------------------------------------------------
                    */
                    const quantity =
                        Number(
                            item.quantity ??
                            1
                        ) || 1;


                    /*
                    |--------------------------------------------------------------------------
                    | RATE
                    |--------------------------------------------------------------------------
                    */
                    const rate =
                        Number(
                            item.price ??
                            item.rate ??
                            0
                        ) || 0;


                    /*
                    |--------------------------------------------------------------------------
                    | AMOUNT
                    |--------------------------------------------------------------------------
                    |
                    | Pre-tax amount.
                    |--------------------------------------------------------------------------
                    */
                    const amount =
                        Number(
                            item.amount ??
                            (price * quantity)
                        ) || 0;


                    /*
                    |--------------------------------------------------------------------------
                    | FINAL TOTAL
                    |--------------------------------------------------------------------------
                    */
                    const total =
                        Number(
                            item.total ??
                            amount
                        ) || 0;


                    return {
                        ...item,

                        price,

                        quantity,

                        rate,

                        amount,

                        total,
                    };
                }
            );


        /*
        |--------------------------------------------------------------------------
        | DOCUMENT TYPE
        |--------------------------------------------------------------------------
        */
        const isQuotation =
            docLabel.toLowerCase() ===
            'quotation';


        /*
        |--------------------------------------------------------------------------
        | SELECT TEMPLATE
        |--------------------------------------------------------------------------
        */
        const selectedTemplate =
            out.template ||
            (
                isQuotation
                    ? out.user?.quotationTemplate
                    : out.user?.invoiceTemplate
            ) ||
            'template1';


        /*
        |--------------------------------------------------------------------------
        | SELECT TEMPLATE COLORS
        |--------------------------------------------------------------------------
        */
        const selectedTemplateColors =
            out.templateColors ||
            (
                isQuotation
                    ? out.user?.quotationTemplateColors
                    : out.user?.invoiceTemplateColors
            ) ||
            {};


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */
        res.json({

            success: true,

            document: {

                /*
                |--------------------------------------------------------------------------
                | ALL ORIGINAL DOCUMENT FIELDS
                |--------------------------------------------------------------------------
                */
                ...out,


                /*
                |--------------------------------------------------------------------------
                | PUBLIC DOCUMENT IDENTIFIERS
                |--------------------------------------------------------------------------
                */
                docLabel,

                number:
                    out[numberField],

                date:
                    out.issueDate,

                dueDate:
                    out[dueDateField],


                /*
                |--------------------------------------------------------------------------
                | INVOICE / QUOTATION NUMBERS
                |--------------------------------------------------------------------------
                */
                invoiceNumber:
                    out.invoiceNumber,

                quotationNumber:
                    out.quotationNumber,


                /*
                |--------------------------------------------------------------------------
                | DATES
                |--------------------------------------------------------------------------
                */
                issueDate:
                    out.issueDate,

                validUntil:
                    out.validUntil,


                /*
                |--------------------------------------------------------------------------
                | BASIC DOCUMENT INFORMATION
                |--------------------------------------------------------------------------
                */
                category:
                    out.category,

                reference:
                    out.reference,

                notes:
                    out.notes,

                termsAndConditions:
                    out.termsAndConditions,

                status:
                    out.status,


                /*
                |--------------------------------------------------------------------------
                | FINANCIAL INFORMATION
                |--------------------------------------------------------------------------
                */
                total:
                    out.total,

                currency:
                    out.currency,

                subtotal:
                    out.subtotal,

                taxTotal:
                    out.taxTotal,

                taxType:
                    out.taxType,

                discountAmount:
                    out.discountAmount,

                overallDiscTotal:
                    out.overallDiscTotal,

                itemDiscount:
                    out.itemDiscount,

                hideDiscount:
                    out.hideDiscount,

                hideDiscountColumn:
                    out.hideDiscountColumn,


                /*
                |--------------------------------------------------------------------------
                | NORMALIZED LINE ITEMS
                |--------------------------------------------------------------------------
                */
                items:
                    normalizedItems,


                /*
                |--------------------------------------------------------------------------
                | CLIENT / CUSTOMER
                |--------------------------------------------------------------------------
                */
                client:
                    out.client,


                /*
                |--------------------------------------------------------------------------
                | BUSINESS INFORMATION
                |--------------------------------------------------------------------------
                */
                businessName:
                    out.user?.businessName,

                businessLogo:
                    out.user?.businessLogo ||
                    null,

                address:
                    out.user?.address,

                gstin:
                    out.user?.gstin,

                phone:
                    out.user?.phone,

                pan:
                    out.user?.pan,

                signatoryName:
                    out.user?.signatoryName,

                designation:
                    out.user?.designation,

                email:
                    out.user?.email,

                businessSignature:
                    out.user?.businessSignature,

                businessSeal:
                    out.user?.businessSeal,

                bankDetails:
                    out.user?.bankDetails,


                /*
                |--------------------------------------------------------------------------
                | TEMPLATE
                |--------------------------------------------------------------------------
                */
                template:
                    selectedTemplate,

                templateColors:
                    selectedTemplateColors,


                /*
                |--------------------------------------------------------------------------
                | USER DEFAULT TEMPLATES
                |--------------------------------------------------------------------------
                */
                invoiceTemplate:
                    out.user?.invoiceTemplate,

                invoiceTemplateColors:
                    out.user?.invoiceTemplateColors,

                quotationTemplate:
                    out.user?.quotationTemplate,

                quotationTemplateColors:
                    out.user?.quotationTemplateColors,


                /*
                |--------------------------------------------------------------------------
                | DOCUMENT SETTINGS
                |--------------------------------------------------------------------------
                */
                documentSettings:
                    out.user?.documentSettings,


                /*
                |--------------------------------------------------------------------------
                | SELECTED BANK ACCOUNT
                |--------------------------------------------------------------------------
                */
                selectedBankIndex:
                    out.selectedBankIndex,


                /*
                |--------------------------------------------------------------------------
                | WATERMARK
                |--------------------------------------------------------------------------
                */
                watermarkImage:
                    out.watermarkImage,


                /*
                |--------------------------------------------------------------------------
                | USER OBJECT
                |--------------------------------------------------------------------------
                |
                | PublicDocumentView can use this object to construct
                | the same invoiceForPDF object as the normal website.
                |--------------------------------------------------------------------------
                */
                user:
                    out.user
                        ? {
                            name:
                                out.user.name,

                            email:
                                out.user.email,

                            businessName:
                                out.user.businessName,

                            businessLogo:
                                out.user.businessLogo,

                            businessSignature:
                                out.user.businessSignature,

                            businessSeal:
                                out.user.businessSeal,

                            address:
                                out.user.address,

                            gstin:
                                out.user.gstin,

                            phone:
                                out.user.phone,

                            pan:
                                out.user.pan,

                            signatoryName:
                                out.user.signatoryName,

                            designation:
                                out.user.designation,

                            bankDetails:
                                out.user.bankDetails,

                            invoiceTemplate:
                                out.user.invoiceTemplate,

                            invoiceTemplateColors:
                                out.user.invoiceTemplateColors,

                            quotationTemplate:
                                out.user.quotationTemplate,

                            quotationTemplateColors:
                                out.user.quotationTemplateColors,

                            documentSettings:
                                out.user.documentSettings,

                            plan:
                                out.user.plan,
                        }
                        : null,


                /*
                |--------------------------------------------------------------------------
                | SHARE TOKEN
                |--------------------------------------------------------------------------
                */
                token:
                    req.params.token,
            },
        });

    } catch (err) {

        console.error(
            `Public ${docLabel} fetch error:`,
            err
        );


        res.status(500).json({

            success: false,

            message:
                'Failed to load document',
        });
    }
};


/*
|--------------------------------------------------------------------------
| INVOICE PDF
|--------------------------------------------------------------------------
*/

const streamInvoicePdf = (
    req,
    res
) =>
    streamDocumentPdf(
        req,
        res,
        {
            Model:
                Invoice,

            docLabel:
                'Invoice',

            numberField:
                'invoiceNumber',
        }
    );


/*
|--------------------------------------------------------------------------
| PUBLIC INVOICE
|--------------------------------------------------------------------------
*/

const getPublicInvoice = (
    req,
    res
) =>
    getPublicDocument(
        req,
        res,
        {
            Model:
                Invoice,

            docLabel:
                'Invoice',

            numberField:
                'invoiceNumber',

            dueDateField:
                'dueDate',
        }
    );


/*
|--------------------------------------------------------------------------
| QUOTATION PDF
|--------------------------------------------------------------------------
*/

const streamQuotationPdf = (
    req,
    res
) =>
    streamDocumentPdf(
        req,
        res,
        {
            Model:
                Quotation,

            docLabel:
                'Quotation',

            numberField:
                'quotationNumber',
        }
    );


/*
|--------------------------------------------------------------------------
| PUBLIC QUOTATION
|--------------------------------------------------------------------------
*/

const getPublicQuotation = (
    req,
    res
) =>
    getPublicDocument(
        req,
        res,
        {
            Model:
                Quotation,

            docLabel:
                'Quotation',

            numberField:
                'quotationNumber',

            dueDateField:
                'validUntil',
        }
    );


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    streamInvoicePdf,

    streamQuotationPdf,

    getPublicInvoice,

    getPublicQuotation,

};
