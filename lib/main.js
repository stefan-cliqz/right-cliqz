var self = require('sdk/self')
var tabs = require("sdk/tabs");
var Request = require('sdk/request').Request
var contextMenu = require("sdk/context-menu");
var { viewFor } = require("sdk/view/core");
var { modelFor } = require("sdk/model/core");
var windows = require("sdk/windows");
var selection = require("sdk/selection");

// this is a test for Jira 

// tabs.activeTab.url = "http://blog.fefe.de";
// tabs.activeTab.url = "http://www.spiegel.de/wirtschaft/unternehmen/e-on-baut-offshore-windpark-vor-brighton-a-1034278.html";

// get cliqz result from API and populate menu
getSelectionRequest = function(selectionText,con) {
  
  menuItem.items = [dummy]

  var request = Request({

    url: "http://webbeta.cliqz.com/api/v1/results?q=" + encodeURIComponent(selectionText),
     
    onComplete: function (response) {

       res = response.json;
       var myItems = []

       // create a submenu item for each result
       for( i in res.result ) {
          var myContentScript = 'self.on("click", function (node, data) {' +' self.postMessage(data)' + '});'  
          
          if( !res.result[i].snippet.title ) { 
            continue; 
          }

          myItems.push(contextMenu.Item(
                      {label: res.result[i].snippet.title.substr(0,50)
                            + ' @ ' + res.result[i].url.substr(7,15) + ' ' 
                            + (res.result[i].snippet.desc ? ' (' 
                            + res.result[i].snippet.desc + ')': ''),
                        contentScript: myContentScript,
                        data: res.result[i].url,
                        image: self.data.url("icon.png"),
                        onMessage: function (url) {
                          tabs.open(url);
                        }}));
        }

        // if no result, go to Google
        if( myItems.length == 0 ) {
          myItems.push(contextMenu.Item(
                      {label: 'Google search for "' + selectionText + '"',
                        contentScript: 'self.on("click", function () {' +' self.postMessage()' + '});',
                        onMessage: function () {
                          tabs.open('https://www.google.de/search?q='+encodeURIComponent(selectionText) );
                        }}));
        }
        menuItem.items = myItems

    }
  }).get();
}


var dummy = contextMenu.Item({label: "Cliqzing.."});

// initalize menu item
var menuItem = contextMenu.Menu({
  label: "Cliqz search" ,
  id: "cliqzmenu",
  targetId: "cliqzmenu",
  context: contextMenu.SelectionContext(),
  image: self.data.url("icon.png"),
  items: [dummy]
});


// add listener when context menu shows up
// @todo: just fire on specific menu
function addListenerShowing(win) {
  var win = viewFor(win);
  cmNode = win.document.getElementById('contentAreaContextMenu')
  cmNode.addEventListener('popupshowing', function(e){
    if(!e.target.id ) { // ugly workaround
        getSelectionRequest(selection.text)
    }
  })
}

// add listener to fire when context menu goes away
function addListenerHiding(win) {
  var win = viewFor(win);
  cmNode = win.document.getElementById('contentAreaContextMenu')
  cmNode.addEventListener('popupshowing', function(e){
    menuItem.items = [dummy]
  })
}

// add listeners for current windows
for( var i in windows.browserWindows) {
  addListenerShowing(windows.browserWindows[i]);
  addListenerHiding(windows.browserWindows[i]);
}

// add listeners for new windows
windows.browserWindows.on("open",function(win) {
    addListenerShowing(win)
    addListenerHiding(win);
});

// servus du Sven du