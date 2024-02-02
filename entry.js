function startApplication(sessionID, stunServers) {

    function createBaseModal(msgArr) {
        var document = window.top.document;

        var modalContainer = document.createElement("div");
        modalContainer.id = "sample-install-modal";
        modalContainer.style.display = "none"; // when the css loads, this will display
        document.body.appendChild(modalContainer);

        var modal = document.createElement("div");
        modalContainer.appendChild(modal);

        for (var i = 0; i < msgArr.length; i++) {
            var p = document.createElement("p");
            p.innerHTML = msgArr[i];
            modal.appendChild(p);
            if (i === 0) {
                p.id = "sample-install-first-para";
            }
        }

        return modalContainer;
    }

    function displayMessageModal(msgArr, okCb) {

        var modalContainer = createBaseModal(msgArr);
        var modal = modalContainer.firstChild;

        var sampleMessageOkButtonPara = document.createElement('p');
        modal.appendChild(sampleMessageOkButtonPara);

        var okButton = document.createElement('input');
        okButton.type = "button";
        okButton.value = "OK";
        okButton.id = "sample-ok-button";
        okButton.onclick = function() {
            okButton.disabled = true;
            okCb();
        };
        sampleMessageOkButtonPara.appendChild(okButton);

        return modalContainer;
    }

    function displayInstallModal(msgArr, pluginUrl, installChosenCb, cancelChosenCb) {

        var modalContainer = createBaseModal(msgArr);
        var modal = modalContainer.firstChild;

        var sampleInstallCancelButtonPara = document.createElement('p');
        sampleInstallCancelButtonPara.id = 'sample-install-button-para';
        modal.appendChild(sampleInstallCancelButtonPara);

        var installButton = document.createElement('input');
        installButton.type = 'button';
        installButton.value = 'Install';
        installButton.id = 'sample-install-button';
        installButton.onclick = function() {
            installButton.disabled = true;
            cancelButton.disabled = true;
            window.top.location.assign(pluginUrl);
            installChosenCb();
        };
        sampleInstallCancelButtonPara.appendChild(installButton);

        var cancelButton = document.createElement('input');
        cancelButton.type = 'button';
        cancelButton.value = 'Cancel';
        cancelButton.id = 'sample-cancel-button';
        cancelButton.onclick = function() {
            installButton.disabled = true;
            cancelButton.disabled = true;
            cancelChosenCb();
        };
        sampleInstallCancelButtonPara.appendChild(cancelButton);

        return modalContainer;
    }

    function presentContinueButton(modalContainer) {
        var installButton = document.getElementById('sample-install-button');
        var cancelButton = document.getElementById('sample-cancel-button');
        cancelButton.parentNode.removeChild(cancelButton);
        installButton.style.float = 'none';
        installButton.style.margin = 'auto';
        installButton.value = 'Continue';
        installButton.disabled = false;
        installButton.onclick = function() {
            modalContainer.parentNode.removeChild(modalContainer);
            startUC();
        };
    }

    function startUC() {
        UC.start(sessionID, stunServers);
        //initialiseVoiceAndVideo();
    }

    function pollForPlugin(modalContainer) {
        UC.checkBrowserCompatibility(function(pluginInfo) {
            if (pluginInfo.status === 'upToDate') {
                modalContainer.parentNode.removeChild(modalContainer);
                startUC();
            } else {
                setTimeout(function() {
                    pollForPlugin(modalContainer);
                }, 5000);
            }
        });
    }

    function logout() {
        document.location.href = 'Logout';
    }

    function noOpt() {
    }

    function continueWithCurrent(modalContainer) {
        modalContainer.parentNode.removeChild(modalContainer);
        startUC();
    }

    function ieInstallMsg(installerFileName, restartRequired) {
        var answer = 'If you choose to install, IE will ask you to run \'' + installerFileName + '\'. Run it and follow the instructions.';
        if (restartRequired) {
            answer += ' A restart of IE will be required to use the new plugin.';
        }
        return answer;
    }

    function safariInstallMsg(installerFileName) {
        return 'If you choose to install, the plugin will be downloaded (\'' + installerFileName + '\'). When it has finished downloading, open the file and follow the instructions. When the installation has completed, restart Safari and log back in.'
    }

    function interactWithUserToInstallPlugin(pluginInfo) {
        var msgArr;
        if (pluginInfo.status === 'installRequired') {
            msgArr = ['To proceed a browser plugin is required.', ''];
        } else { // pluginInfo.status === 'upgradeRequired'
            msgArr = ['A later version of the browser plugin is required.', ''];
        }
        msgArr.push('Click \'Install\' to download version ' + pluginInfo.latestAvailable + ' of the plugin.', 'Click \'Cancel\' to quit.', '');
        var modalContainer;
        var url = pluginInfo.pluginUrl;
        var installerFileName = url.substr(url.lastIndexOf('/') + 1);
        switch (UC.detectedUserAgent) {
            case 'ie':
                msgArr.push(ieInstallMsg(installerFileName, pluginInfo.restartRequired));
                installChosenCb = pluginInfo.restartRequired ? noOpt : function(){ pollForPlugin(modalContainer) };
                cancelChosenCb = logout;
                break;
            case 'safari':
                msgArr.push(safariInstallMsg(installerFileName));
                installChosenCb = noOpt;
                cancelChosenCb = logout;
                break;
            default:
                console.error('Didn\'t expect to handle plugins for user agent ' + UC.detectedUserAgent);
                throw 'Didn\'t expect to handle plugins for user agent ' + UC.detectedUserAgent;
        }
        modalContainer = displayInstallModal(msgArr, url, installChosenCb, cancelChosenCb);
    }

    function informUserBrowserUpdateRequired(browserInfo) {
        var browserName = browserInfo.name[0].toUpperCase() + browserInfo.name.substring(1);
        var msgArr = ["This version (" + browserInfo.version + ") of " + (browserName === "Ie" ? "Internet Explorer" : browserName) + " is not supported."];
        msgArr.push("Please update to version " + browserInfo.minimumRequired + " or greater.");
        displayMessageModal(msgArr, logout);
    }

    function informUserBrowserNotSupported(browserInfo) {
        var browserName = browserInfo.name[0].toUpperCase() + browserInfo.name.substring(1);
        var msgArr = ["This browser (" + browserName + ") is not supported."];
        msgArr.push("Please try another browser.");
        displayMessageModal(msgArr, logout);
    }

    function interactWithUserToOptionallyInstallPlugin(pluginInfo) {
        var msgArr = ['A later version of the browser plugin is available.', '', 'Click \'Install\' to download version ' + pluginInfo.latestAvailable + ' of the plugin.', 'Click \'Cancel\' to continue with the installed version ' + pluginInfo.installedVersion + '.', ''];
        var modalContainer;
        var url = pluginInfo.pluginUrl;
        var installerFileName = url.substr(url.lastIndexOf('/') + 1);
        switch (UC.detectedUserAgent) {
            case 'ie':
                msgArr.push('If you choose to install, IE will ask you to run \'' + installerFileName + '\'. Run it and follow the instructions.');
                installChosenCb = function(){ presentContinueButton(modalContainer) };
                break;
            case 'safari':
                msgArr.push(safariInstallMsg(installerFileName));
                installChosenCb = noOpt;
                break;
            default:
                console.error('Didn\'t expect to handle plugins for user agent ' + UC.detectedUserAgent);
                throw 'Didn\'t expect to handle plugins for user agent ' + UC.detectedUserAgent;
        }
        modalContainer = displayInstallModal(msgArr, pluginInfo.pluginUrl, installChosenCb, function(){ continueWithCurrent(modalContainer); });
    }

    UC.checkBrowserCompatibility(function(pluginInfo, browserInfo) {
        if(browserInfo.isSupported) {
            if (pluginInfo.status === 'installRequired' || pluginInfo.status === 'upgradeRequired') {
                interactWithUserToInstallPlugin(pluginInfo);
            } else if (pluginInfo.status === 'upgradeOptional') {
                interactWithUserToOptionallyInstallPlugin(pluginInfo);
            } else {
                startUC();
            }
        } else if (browserInfo.status === "upgradeRequired") {
            informUserBrowserUpdateRequired(browserInfo);
        } else {
            informUserBrowserNotSupported(browserInfo);
        }
    });

  /*  openAED = function() {
        console.log("about to open window: username " + username);
        window.open('Aed.jsp?username=' + username);
        return false;
    };*/

    // Poll to keep user session alive - every 15 mins (default timeout is 30 mins)
    var poll = function() {
        console.log("Sending poll for keepalive");
        var request = new XMLHttpRequest();
        request.open("GET", "Poll", true);
        request.send();
    };
    window.setInterval(poll, 900000);
}
