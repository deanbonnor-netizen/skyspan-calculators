/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 * Skyspan Architectural Skylight & Glass Floor Calculator Suitelet
 * Script Name: Skyspan Calculator Suitelet
 * Script ID: customscript_skyspan_calc_suitelet
 * Deployment ID: customdeploy_skyspan_calc_suitelet
 * 
 * Description: Renders the Skyspan Architectural Skylight & Glass Floor Calculator natively inside NetSuite,
 * pre-loads Opportunity/Estimate transaction data, and handles direct line item & PDF attachment pushes.
 */

define(['N/ui/serverWidget', 'N/file', 'N/record', 'N/search', 'N/encode', 'N/render', 'N/https'],
function(serverWidget, file, record, search, encode, render, https) {

    function onRequest(scriptContext) {
        const req = scriptContext.request;
        const res = scriptContext.response;

        if (req.method === 'GET') {
            const transId = req.parameters.transId;
            const transType = req.parameters.transType || 'estimate';

            let contextData = {
                transId: transId || '',
                transType: transType || '',
                entityName: '',
                jobRef: '',
                siteAddress: '',
                date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
            };

            // If launched from a Transaction Record (Estimate / Opportunity / Sales Order), fetch details
            if (transId) {
                try {
                    const transRec = record.load({ type: transType, id: transId });
                    contextData.jobRef = transRec.getValue({ fieldId: 'tranid' }) || transRec.getValue({ fieldId: 'title' }) || '';
                    
                    const entityId = transRec.getValue({ fieldId: 'entity' });
                    if (entityId) {
                        const entitySearch = search.lookupFields({
                            type: search.Type.ENTITY,
                            id: entityId,
                            columns: ['companyname', 'entityid']
                        });
                        contextData.entityName = entitySearch.companyname || entitySearch.entityid || '';
                    }

                    contextData.siteAddress = transRec.getValue({ fieldId: 'shipaddress' }) || transRec.getValue({ fieldId: 'billaddress' }) || '';
                } catch (e) {
                    log.error('Error loading transaction details', e);
                }
            }

            // Load index.html from File Cabinet (Search for index.html in SuiteScripts folder)
            let htmlContent = '';
            try {
                const fileSearch = search.create({
                    type: 'file',
                    filters: [['name', 'is', 'index.html']],
                    columns: ['internalid']
                }).run().getRange({ start: 0, end: 1 });

                if (fileSearch && fileSearch.length > 0) {
                    const htmlFile = file.load({ id: fileSearch[0].id });
                    htmlContent = htmlFile.getContents();
                } else {
                    res.write('Error: index.html not found in NetSuite File Cabinet. Please upload index.html to File Cabinet /SuiteScripts/Skyspan/.');
                    return;
                }
            } catch (err) {
                log.error('File Cabinet Search Error', err);
                res.write('Error loading HTML file from File Cabinet: ' + err.message);
                return;
            }

            // Inject preloaded NetSuite transaction context script into HTML
            const netSuiteContextScript = `<script>
                window.NETSUITE_CONTEXT = ${JSON.stringify(contextData)};
                document.addEventListener("DOMContentLoaded", function() {
                    if (window.NETSUITE_CONTEXT && window.NETSUITE_CONTEXT.jobRef) {
                        const jobRefInput = document.getElementById('jobRef');
                        if (jobRefInput && !jobRefInput.value) {
                            jobRefInput.value = window.NETSUITE_CONTEXT.jobRef;
                        }
                    }
                });
            </script>`;

            htmlContent = htmlContent.replace('</head>', netSuiteContextScript + '\n</head>');

            // Output clean HTML
            res.setHeader({ name: 'Content-Type', value: 'text/html; charset=UTF-8' });
            res.write(htmlContent);

        } else if (req.method === 'POST') {
            // Handle Pushing Line Item & Attached PDF directly to Transaction
            try {
                const payload = JSON.parse(req.body);
                const { transId, transType, lineDescription, totalAmount, customerPdfBase64, jobRecordPdfBase64 } = payload;

                if (!transId) {
                    res.write(JSON.stringify({ success: false, message: 'No Transaction ID provided' }));
                    return;
                }

                const transRec = record.load({ type: transType, id: transId, isDynamic: true });

                // 1. Add Line Item to Transaction
                transRec.selectNewLine({ sublistId: 'item' });
                // Replace with your Skyspan Custom Skylight Item Internal ID in NetSuite
                transRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: payload.itemId || 1 }); 
                transRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: lineDescription });
                transRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                transRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: totalAmount });
                transRec.commitLine({ sublistId: 'item' });

                // 2. Save Customer Specification PDF to File Cabinet & Attach to Transaction
                if (customerPdfBase64) {
                    const custPdfFile = file.create({
                        name: `Customer_Spec_${transRec.getValue('tranid') || transId}.pdf`,
                        fileType: file.Type.PDF,
                        contents: customerPdfBase64,
                        isOnline: true
                    });
                    custPdfFile.folder = payload.folderId || -15; 
                    const custPdfId = custPdfFile.save();

                    record.attach({
                        record: { type: 'file', id: custPdfId },
                        to: { type: transType, id: transId }
                    });
                }

                // 3. Save Internal Job Record PDF to File Cabinet & Attach to Transaction
                if (jobRecordPdfBase64) {
                    const jobPdfFile = file.create({
                        name: `Internal_Job_Record_${transRec.getValue('tranid') || transId}.pdf`,
                        fileType: file.Type.PDF,
                        contents: jobRecordPdfBase64,
                        isOnline: false
                    });
                    jobPdfFile.folder = payload.folderId || -15;
                    const jobPdfId = jobPdfFile.save();

                    record.attach({
                        record: { type: 'file', id: jobPdfId },
                        to: { type: transType, id: transId }
                    });
                }

                const savedId = transRec.save();
                res.write(JSON.stringify({ success: true, transactionId: savedId, message: 'Line item and PDFs attached successfully to NetSuite!' }));

            } catch (err) {
                log.error('POST Push Error', err);
                res.write(JSON.stringify({ success: false, error: err.message }));
            }
        }
    }

    return {
        onRequest: onRequest
    };
});
