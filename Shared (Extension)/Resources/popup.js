
function getActiveTab() {
    return browser.tabs.query({active: true, currentWindow: true});
}

document.getElementById("broom-checkbox").addEventListener("click", function() {
    getActiveTab().then((tabs) => {        
        if (this.checked == true){
            browser.tabs.sendMessage(tabs[0].id, {
                command: "broom-xray-enabled",
            });
        } else {
            browser.tabs.sendMessage(tabs[0].id, {
                command: "broom-xray-disabled",
            });
        };
    });
});

document.getElementById("broom-clear-button").addEventListener("click", function() {
    getActiveTab().then((tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {
            command: "broom-clear-selected",
        });
    });
});

getActiveTab().then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, { command: "broom-get-status" }, function(response) {
        document.getElementById("broom-checkbox").checked = response;
    });
    
    browser.tabs.sendMessage(tabs[0].id, { command: "broom-get-marks" }, function(response) {
        document.getElementById("broom-page-marks").innerHTML = response.join('<br/>');
    });
});
