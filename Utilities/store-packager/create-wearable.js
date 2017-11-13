//
//  create-wearable.js
//
//  Created by Liv Erickson on 11/6/17.
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
//  This script is a tool that can be used to turn a wearable into a display copy
//  Requires lock access
//
/* globals Selection */
(function(){
    var APP_NAME = "WEARABLE";
    var APP_URL = Script.resolvePath("app.html?" + Date.now());
    var APP_ICON;

    var SERVER_URL = "https://hifi-content.s3.amazonaws.com/liv/avatar_shopping_demo/wearableServer.js"; 

    var prevID = 0;
    var listName = "contextOverlayHighlightList";
    var listType = "entity";

    var tablet = Tablet.getTablet('com.highfidelity.interface.tablet.system');    

    function handleMousePress(entityID) {
        print("Clicked: " + entityID);
        if (prevID !== entityID) {
            Selection.addToSelectedItemsList(listName, listType, entityID);
            prevID = entityID;
        }
        tablet.emitScriptEvent(entityID);
    }

    function handleMouseLeave(entityID) {
        if (prevID !== 0) {
            Selection.removeFromSelectedItemsList("contextOverlayHighlightList", listType, prevID);
            prevID = 0;
        }
    }

    var baseUserdata = {
        "Attachment": {
            "action": "attach",
            "joint": "",
            "attached" : false,
            "options": {
                "translation": {
                    "x": 0,
                    "y": 0,
                    "z": 0
                },
                "scale": 1
            }
        },
        "grabbableKey": {
            "cloneable": false,
            "grabbable": true
        }
    };

    var button = tablet.addButton({
        text: APP_NAME
    });

    
    function maybeExited() {
        print("Exited app page");
        Entities.clickReleaseOnEntity.disconnect(handleMousePress);
        Entities.hoverLeaveEntity.disconnect(handleMouseLeave);
        tablet.screenChanged.disconnect(maybeExited);
    }

    function clicked(){
        tablet.gotoWebScreen(APP_URL);
        Entities.clickReleaseOnEntity.connect(handleMousePress);
        Entities.hoverLeaveEntity.connect(handleMouseLeave);
        Script.setTimeout(function(){
            tablet.screenChanged.connect(maybeExited); 
        }, 2000);
    }
    button.clicked.connect(clicked);

    function onWebEventReceived(event){
        if (typeof(event) === "string") {
            event = JSON.parse(event);
        }
        if (event.type === "submit") {
            var entityID = event.entityID;
            var joint = event.joint;
            var marketplaceID = event.marketplaceID;

            var newUserDataProperties = baseUserdata;
            newUserDataProperties["marketplaceID"] = marketplaceID;
            newUserDataProperties["Attachment"].joint = joint;

            print(JSON.stringify(newUserDataProperties));

            Entities.editEntity(entityID, {locked: false});

            Entities.editEntity(entityID, {userData: JSON.stringify(newUserDataProperties),
                serverScripts: SERVER_URL});

            Script.setTimeout(function(){
                Entities.editEntity(entityID, {locked: true});
            }, 2000);
        }
    }

    tablet.webEventReceived.connect(onWebEventReceived);

    function cleanup(){
        tablet.removeButton(button);
    }

    Script.scriptEnding.connect(cleanup);
}());