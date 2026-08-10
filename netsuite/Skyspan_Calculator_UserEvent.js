/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Skyspan Calculator User Event Script
 * Script Name: Skyspan Calculator User Event
 * Script ID: customscript_skyspan_calc_userevent
 * Deployment ID: customdeploy_skyspan_calc_userevent
 * 
 * Description: Adds the "📄 Launch Skylight Calculator" button to NetSuite Estimate (Quote)
 * and Opportunity transaction forms.
 */

define(['N/url', 'N/runtime'], function(url, runtime) {

    function beforeLoad(scriptContext) {
        // Only run on VIEW and EDIT modes in the browser UI
        if (scriptContext.type === scriptContext.UserEventType.VIEW || scriptContext.type === scriptContext.UserEventType.EDIT) {
            if (runtime.executionMode !== runtime.ExecutionMode.USER_INTERFACE) return;

            const form = scriptContext.form;
            const rec = scriptContext.newRecord;

            try {
                // Resolve the Suitelet URL
                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_skyspan_calc_suitelet',
                    deploymentId: 'customdeploy_skyspan_calc_suitelet',
                    params: {
                        transId: rec.id,
                        transType: rec.type
                    }
                });

                // Add button to NetSuite transaction header bar
                form.addButton({
                    id: 'custpage_btn_launch_skyspan_calc',
                    label: '📄 Launch Skylight Calculator',
                    functionName: `window.open('${suiteletUrl}', 'SkyspanCalculator', 'width=1340,height=920,resizable=yes,scrollbars=yes');`
                });
            } catch (err) {
                log.error('Error adding Launch Skylight Calculator button', err);
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
