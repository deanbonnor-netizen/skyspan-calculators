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
 * SETUP NOTE: After uploading index.html to File Cabinet > SuiteScripts > Skyspan,
 * find its Internal ID (hover over the file name in File Cabinet) and set
 * SKYSPAN_HTML_FILE_ID below. This avoids permission issues from file searches.
 * 
 * Description: Renders the Skyspan Architectural Skylight & Glass Floor Calculator natively inside NetSuite,
 * pre-loads Opportunity/Estimate transaction data, and handles direct line item & PDF attachment pushes.
 */

/**
 * !! IMPORTANT: Set this to the internal ID of your index.html in the File Cabinet.
 * To find it: Documents > Files > File Cabinet > SuiteScripts > Skyspan > hover over index.html
 * It will show the internal ID in the URL or tooltip, e.g. ?id=12345
 */
const SKYSPAN_HTML_FILE_ID = null; // <-- Replace null with e.g. 12345

define(['N/file', 'N/record', 'N/search', 'N/url', 'N/runtime', 'N/log'],
function(file, record, search, url, runtime, log) {

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

            // Load index.html from File Cabinet
            let htmlContent = '';
            try {
                let htmlFileId = SKYSPAN_HTML_FILE_ID;

                // If no hardcoded ID, fall back to searching — filter to SuiteScripts folder
                if (!htmlFileId) {
                    const fileSearch = search.create({
                        type: 'file',
                        filters: [
                            ['name', 'is', 'index.html'],
                            'AND',
                            ['folder.path', 'contains', 'SuiteScripts']
                        ],
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 5 });

                    if (fileSearch && fileSearch.length > 0) {
                        htmlFileId = fileSearch[0].id;
                    }
                }

                if (!htmlFileId) {
                    res.setHeader({ name: 'Content-Type', value: 'text/html; charset=UTF-8' });
                    res.write('<h2 style="font-family:sans-serif;color:#c00;padding:40px">Setup Required</h2>' +
                        '<p style="font-family:sans-serif;padding:0 40px">Upload <strong>index.html</strong> to File Cabinet under <strong>SuiteScripts &gt; Skyspan</strong>, then set <code>SKYSPAN_HTML_FILE_ID</code> at the top of the Suitelet script to that file\'s Internal ID.</p>');
                    return;
                }

                const htmlFile = file.load({ id: htmlFileId });
                htmlContent = htmlFile.getContents();

            } catch (err) {
                log.error('File Cabinet Load Error', err);
                res.setHeader({ name: 'Content-Type', value: 'text/html; charset=UTF-8' });
                res.write('<h2 style="font-family:sans-serif;color:#c00;padding:40px">File Access Error</h2>' +
                    '<p style="font-family:sans-serif;padding:0 40px"><strong>Error:</strong> ' + err.message + '</p>' +
                    '<p style="font-family:sans-serif;padding:0 40px"><strong>Fix:</strong> Find the Internal ID of <em>index.html</em> in File Cabinet and set <code>SKYSPAN_HTML_FILE_ID</code> at the top of this Suitelet script.</p>');
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
