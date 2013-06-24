
//Field Service Mobile Application
//Copyright 2013 Cory Cowgill Twitter: @corycowgill

//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.

//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.

//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.




//Signature Capture Functionality - Canvas Drawing
var isDrawing = false;

function DrawingUtil() {
    isDrawing = false;
    canvas.addEventListener("touchstart",start,false);
    canvas.addEventListener("touchmove",draw,false);
    canvas.addEventListener("touchend",stop,false);
    context.strokeStyle = "#FFF";  
}

//Start Event for Signature Captuare on HTML5 Canvas
function start(event) {
	var logToConsole = cordova.require("salesforce/util/logger").logToConsole;
	logToConsole("drawing start....");
	isDrawing = true;
	
	canvas = document.getElementById("signatureCanvas");
	context = canvas.getContext("2d");    
	context.strokeStyle = "rgba(155,0,0,0.5)";	
	logToConsole("drawing start finishing.......");
	
	context.beginPath();
    context.moveTo(event.touches[0].pageX,event.touches[0].pageY);
}

//Event while someone is drawing to caputre the path while they draw....
function draw(event) {
	event.preventDefault();
    if(isDrawing) {    	
    	context.lineTo(event.touches[0].pageX,event.touches[0].pageY);
        context.stroke();
    }
}


//Event when someone stops drawing their signature line
function stop(event) {
    if(isDrawing) {
    	var logToConsole = cordova.require("salesforce/util/logger").logToConsole;
    	logToConsole("drawing stop....");
        context.stroke();
        context.closePath();
        isDrawing = false;
    }
}

//Return X Coording while someone is drawing (Logs Testing to ensure capture is working)
function getX(event) {
		var logToConsole = cordova.require("salesforce/util/logger").logToConsole;
		logToConsole("drawing stop....X: ");
		
        return event.touches[0].pageX;
}

//Return Y Coording while someone is drawing (Logs Testing to ensure capture is working)
function getY(event) {
	var logToConsole = cordova.require("salesforce/util/logger").logToConsole;
	logToConsole("drawing stop....Y: " + event.touches[0].pageY + '   OFSETT: ' + offsetY);
		
        return event.touches[0].pageY;
}


//This function registers some Click Handlers per the Example from Contact Explorer in Salesforce Mobile SDK Examples
function regLinkClickHandlers() {

	
	
    var $j = jQuery.noConflict();
    var logToConsole = cordova.require("salesforce/util/logger").logToConsole;

    
    //When someone clicks Save, fire the SAVE operation vi ForceTK to update the Case Record with updates.
    $j('#caseSaveButton').click(function(){
        var updateCase = {}; 
        updateCase['Description'] = $j('#caseDetails').val();
        updateCase['Status'] = $j('#caseStatus').val();
    	forcetkClient.update("Case",selectedCase.Id,updateCase,saveSuccess,saveError)});

    //When someone clicks Save on Signature Capture Page, fire the insert operation vi ForceTK to insert the signature as an Attachment record on the Case.
    $j('#sigSaveButton').click(function(){
    	var strDataURI = canvas.toDataURL();
    	strDataURI = strDataURI.replace(/^data:image\/(png|jpg);base64,/, "");
    	var attachmentRecord = {};
    		attachmentRecord["Name"] = 'Client Signature.png';
    		attachmentRecord["Body"] = strDataURI;
    		attachmentRecord["ContentType"] = "image/png";
    		attachmentRecord["ParentId"] = selectedCase.Id;
    	forcetkClient.insertRecord("Attachment",attachmentRecord,saveSuccess,saveError);
    });
    
    //When someone clicks the Serach Devices button, search via ForceTK on the Devices with a String for Serial Number
    $j('#searchDevicesButton').click(function(){forcetkClient.query("Select Id, Name, Account__r.Name, Serial_Number__c from Device__c where Serial_Number__c like '%" + $j('#serialSearch').val() + "%' limit 50",onSuccessDeviceSearch,onErrorDeviceSearch);})
    
    
    //When someone decides to change the filters on the Case page, execute a query via ForceTK to refresh list on criteria in drop down
    $j('#caseFilterList').change(
    		function() {
    					logToConsole("Get Cases Query....");
    					var caseFilter = $j('#caseFilterList').val();
                        if( caseFilter == "allCases")
                        {
                        	$j.mobile.loading( 'show' );
                            forcetkClient.query("Select Id, CaseNumber, Description, Status, Subject, Priority, ContactId, Contact.Name, Contact.Email, Contact.Phone, Account.Name, AccountId, Account.BillingStreet, Account.BillingCity, Account.BillingState, Account.BillingPostalCode, Device__c, Device__r.Name, Device__r.Model__c, Device__r.Serial_Number__c, (Select Id, Subject, StartDateTime from Events order by StartDateTime limit 1 ),(Select Id, Name,  Quantity__c, Part__r.Name from Case_Parts__r) from Case",onSuccessSfdcCases, onErrorSfdc);
                        }else if(caseFilter == "allHighPriority")
                        {
                        	$j.mobile.loading( 'show' );
                        	forcetkClient.query("Select Id, CaseNumber, Description, Status, Subject, Priority, ContactId, Contact.Name, Contact.Email, Contact.Phone, Account.Name, AccountId, Account.BillingStreet, Account.BillingCity, Account.BillingState, Account.BillingPostalCode, Device__c, Device__r.Name, Device__r.Model__c, Device__r.Serial_Number__c, (Select Id, Subject, StartDateTime from Events order by StartDateTime limit 1 ),(Select Id, Name, Quantity__c, Part__r.Name from Case_Parts__r) from Case where Priority = 'High'",onSuccessSfdcCases, onErrorSfdc);
                        }else if(caseFilter == "allWithin1Mile")
                        {
                        	//forcetkClient.query("Select Id, CaseNumber, Status, Subject, Priority, ContactId, Contact.Name, Contact.Email, Contact.Phone, Account.Name, AccountId from Case where Priority = 'High'",onSuccessSfdcCases, onErrorSfdc);
                        }
                        });    
}



//When the Search on a Device is successful, update the DOM with the results from REST API and refresh (create)
function onSuccessDeviceSearch(response)
{
	
	var $j = jQuery.noConflict();
	$j.mobile.loading( 'hide' );
    cordova.require("salesforce/util/logger").logToConsole("onSuccessSfdcCases: received " + response.totalSize + " cases");
    
    $j("#div_device_devices_list").html("");
    var ul = $j('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a"></ul>');
    $j("#div_device_devices_list").append(ul);
    ul.append($j('<li data-role="list-divider">Devices: ' + response.totalSize + '</li>'));
    $j.each(response.records, function(i, record) 
    {
    	var newLi = $j("<li>Device Name: " + record.Name + "<br/>" + record.Account__r.Name + "<br/>" + record.Serial_Number__c +"</li>");
    	ul.append(newLi);
    });
	//alert(JSON.stringify(response));
    $j("#div_device_devices_list").trigger("create");
}

//When the Search on a Device is unsuccessful, simply throw an error alert to show JSON failure message....
//For production app you would want to make this pretty and meaningful to end user.
function onErrorDeviceSearch(response)
{
	$j.mobile.loading( 'hide' );
	alert(JSON.stringify(response));
}

//When the serach on a device is successful, build list
function onSuccessDevice(contacts) {
    var $j = jQuery.noConflict();
    $j.mobile.loading( 'hide' )
    cordova.require("salesforce/util/logger").logToConsole("onSuccessDevice: received " + contacts.length + " contacts");
    $j("#div_device_contact_list").html("")
    var ul = $j('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a"></ul>');
    $j("#div_device_contact_list").append(ul);
    
    ul.append($j('<li data-role="list-divider">Device Contacts: ' + contacts.length + '</li>'));
    $j.each(contacts, function(i, contact) {
           var formattedName = contact.name.formatted;
           if (formattedName) {
           var newLi = $j("<li><a href='#'>" + (i+1) + " - " + formattedName + "</a></li>");
           ul.append(newLi);
           }
           });
    
    $j("#div_device_contact_list").trigger( "create" )

}

function onErrorDevice(error) {
	$j.mobile.loading( 'hide' );
	cordova.require("salesforce/util/logger").logToConsole("onErrorDevice: " + JSON.stringify(error) );
    alert('Error getting device contacts!');
}


//When the search on cases is successful, update DOM with the results from REST API and refresh to rerender (CREATE)
function onSuccessSfdcCases(response) {
	
	var $j = jQuery.noConflict();
	$j.mobile.loading( 'hide' );
    cordova.require("salesforce/util/logger").logToConsole("onSuccessSfdcCases: received " + response.totalSize + " cases");
    
    $j("#div_device_case_list").html("");
    var ul = $j('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a"></ul>');
    $j("#div_device_case_list").append(ul);
    
    ul.append($j('<li data-role="list-divider">Service Cases: ' + response.totalSize + '</li>'));
    allCases = new Object();
    $j.each(response.records, function(i, record) {
    	   var scheduleTime = "";
    	   if(record.Events != null && record.Events != 'undefined' && typeof record.Events.records != 'undefined' && record.Events.records != null)
    	   {
    		   $j.each(record.Events.records, function(f, record1) {
    		   var date1 = new Date(record1.StartDateTime);
    		   var minutes = "00";
    		   if(date1.getMinutes() >= 10)
    		   {
    			minutes = date1.getMinutes();   
    		   }else
    		   {
    			   minutes = "0" + date1.getMinutes();
    		   }   
    		   scheduleTime = "Service: " + (date1.getMonth() + 1) + '/' + date1.getDate() + '/' + date1.getFullYear() + " at " + formatAMPM(date1);
    		   });
    	   }   
           var newLi = $j("<li><a id='caseId_" + record.CaseNumber + "' href='#service-case-details' data-transition='slide'>Case # " + record.CaseNumber + "<br/>" + record.Account.Name + "<br/>" + scheduleTime +"</a></li>");
           allCases[String(record.CaseNumber)] = record;
           ul.append(newLi);
           });
    $j("#div_device_case_list").trigger( "create" );
    $j.each(response.records,function(i,record){
    	var link = $j("#caseId_" + record.CaseNumber);
    	link.on('click', function(){setDetailCase(String(record.CaseNumber));});
    });
}


function setDetailCase(inputcaseNumber)
{
	//alert('SetDetailCase:' + inputcaseNumber);
	var $j = jQuery.noConflict();
	$j.mobile.loading( 'hide' );
	selectedCase = allCases[inputcaseNumber];
	//alert('Set Case Details ' + JSON.stringify(selectedCase));
	$j("#case-details_content").html("");
	context.clearRect(0, 0, canvas.width, canvas.height);
	var chatterFeedDIV = "<div id='chatterContentOuter'></div>"; 
	var partsDiv = "<div id='caseParts' data-role='collapsible-set' data-theme='c' data-content-theme='d'><div data-role='collapsible' data-collapsed='true'><h3>Case Parts</h3>";
	var caseTest = "<h1>Case: " + selectedCase.CaseNumber + "</h1> " + chatterFeedDIV + "<h3>Account: "+selectedCase.Account.Name+"</h3><p>" + selectedCase.Account.BillingStreet + "<br/>" + selectedCase.Account.BillingCity + " " + selectedCase.Account.BillingState + ", " + selectedCase.Account.BillingPostalCode + "<p>Contact: "+selectedCase.Contact.Name+"</p><p>Phone: <a href='tel:" + selectedCase.Contact.Phone + "'>" + selectedCase.Contact.Phone +"</a></p><p>Device Model: " + selectedCase.Device__r.Model__c + "</p><p>Device Serial #:" + selectedCase.Device__r.Serial_Number__c + "</p>";
	var caseStatus = "<div data-role='fieldcontain'><label for='caseStatus'>Status:</label><select name='caseStatus' id='caseStatus'><option value='New'>New</option><option value='Working'>Working</option><option value='Closed'>Closed</option></select>";
	var caseDetails = "<div data-role='fieldcontain'><label for='caseDetails'>Description:</label><textarea rows='6' name='caseDetails' id='caseDetails' value='" + selectedCase.Description + "' /></div>";
	var caseSubject = "<div data-role='fieldcontain'><label for='caseSubject'>Subject:</label><input type='text' name='caseSubject' id='caseSubject' value='" + selectedCase.Subject + "' /></div>";
	var cusSigButton = "<p>Capture Documentation</p><a href='#customerSignaturePage' id='custSignatureButton' data-role='button' width='100%' data-inline='true'><img src='images/input-tablet-4.png'/></a><p onclick='javascript:capturePhoto();' id='photoButtonCase' data-role='button' data-inline='true'><img src='images/camera-photo-8.png'/></p>";

	
	if(selectedCase.Case_Parts__r != null && selectedCase.Case_Parts__r.records != null)
	{
	    var partDiv = "<div style='border-bottom:1px solid'>";
		$j.each(selectedCase.Case_Parts__r.records, function(i, partRecord) {partDiv = partDiv + "<div style='border-bottom:1px solid'><p>Part: " + partRecord.Part__r.Name + "<br/>Qty:" + partRecord.Quantity__c + "</p></div>";});
		partsDiv += partDiv + "</div>";
	}
	partsDiv += "</div></div>";
	
	var caseDetailHTML = $j(caseTest + caseStatus + caseSubject + caseDetails + partsDiv  +cusSigButton); 

	$j("#case-details_content").append(caseDetailHTML);
	$j("#caseStatus").val(selectedCase.Status);
	$j("#case-details_content").trigger("create");
	
	pullCaseChatter();
}

function pullCaseChatter()
{
	forcetkClient.query("Select c.Id, c.CreatedBy.Name, c.CreatedById, c.CreatedDate, c.Body, (Select Id, FeedItemId, ParentId, CreatedById, CreatedBy.Name, CreatedDate, CommentBody, InsertedById, CommentType, RelatedRecordId From FeedComments),(Select Id, FeedItemId, FieldName, OldValue, NewValue From FeedTrackedChanges) From CaseFeed c where ParentId = '" + selectedCase.Id + "'", onSuccessSfdcCaseFeed, onErrorSfdc); 
}

function onSuccessSfdcCaseFeed(response)
{
	var $j = jQuery.noConflict();
	$j("#chatterContentOuter").html("");
	var chatterFeedDIV = "<div id='chatterContent' data-role='collapsible-set' data-theme='c' data-content-theme='d'><div data-role='collapsible' data-collapsed='true'><h3>Chatter Feed</h3>";
	$j.each(response.records, function(i, record) {
		var date1 = new Date(record.CreatedDate);
		var feedBody = "";
		if(record.Body != null && record.Body != "null")
		{
			feedBody = record.Body;
		}else if(record.FeedTrackedChanges != null && record.FeedTrackedChanges.records != null)
		{
			$j.each(record.FeedTrackedChanges.records, function(i, recordFT){feedBody = recordFT.FieldName + " changed from " + recordFT.OldValue + " to " + recordFT.NewValue;});
		}
		var chatterItemPost = "<div style='border-bottom:1px solid'><p>" + record.CreatedBy.Name + " on " + (date1.getMonth() + 1) + '/' + date1.getDate() + '/' + date1.getFullYear() + "</p><p>" +  feedBody + "</p>";
		var subPost = record.FeedComments;
		if(typeof subPost != 'undefined' && subPost != null && typeof subPost.records != 'undefined' && subPost.records != null)
		{
			var subCommentsDiv = "<div style='margin-left:10px; background-color:#e0ffff;'>";
			$j.each(subPost.records, function(i, record){subCommentsDiv+="<p>"+record.CreatedBy.Name + "</p><p>" + record.CommentBody + "</p>"});
			subCommentsDiv += "</div>";
			chatterItemPost += subCommentsDiv;
		}	
		chatterItemPost += "</div>";
		chatterFeedDIV += chatterItemPost;
	});
	chatterFeedDIV += "</div></div>";
	//alert($j("#chatterContentOuter").html());
	$j("#chatterContentOuter").append(chatterFeedDIV);
	$j("#chatterContentOuter").trigger("create");
}

function onErrorSfdc(error) {
	$j.mobile.loading( 'hide' );
    cordova.require("salesforce/util/logger").logToConsole("onErrorSfdc: " + JSON.stringify(error));
    alert('Error getting sfdc data!' + JSON.stringify(error));
}


function capturePhoto(){
    navigator.camera.getPicture(uploadPhoto,errorPhoto,{sourceType:1,quality:50,destinationType:0});
}

function errorPhoto(response)
{
	alert(response);
}

function queryDayEvents()
{
	var $j = jQuery.noConflict();
	$j.mobile.loading( 'show' );
	forcetkClient.query("Select Id, WhatId, Subject, StartDateTime, What.Name, Account.Name, Account.BillingStreet, Account.BillingCity, Account.BillingState, Account.BillingPostalCode, Who.Email, Who.Name from Event where OwnerId = '" + userId + "' and StartDateTime = TODAY order by StartDateTime limit 50",onSuccessSfdcEvents, onErrorSfdc);
}

function onSuccessSfdcEvents(response)
{
	$j("#calendar").html("");
	$j.mobile.loading( 'hide' );
	var caseIds = new Array();
	var ul = $j('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a"></ul>');
	ul.append($j('<li data-role="list-divider">Number of Appointments Today: ' + response.totalSize + '</li>'));
	$j("#calendar").append(ul);
	$j.each(response.records, function(i, record) {
		caseIds.push(record.WhatId); //Add Case ID to search for Case IDS for populating in DOM / Model
		var date1 = new Date(record.StartDateTime);
		var minutes = "00";
		if(date1.getMinutes() >= 10)
		{
			minutes = date1.getMinutes();   
		}else
		{
			minutes = "0" + date1.getMinutes();
		}   
		scheduleTime = "Service: " + (date1.getMonth() + 1) + '/' + date1.getDate() + '/' + date1.getFullYear() + " at " + formatAMPM(date1);
		var eventItem = "<li><a id='caseIdLink_" + record.What.Name + "' onclick='javascript:' href='#service-case-details' data-transition='slide'>" + scheduleTime + "<br/>Service Type: " + record.Subject + "</br>Case: " + record.What.Name + "<br/>Account: " + record.Account.Name + "</br>Contact: " + record.Who.Name + "</br>" + record.Account.BillingStreet +"</br>" + record.Account.BillingCity + " " + record.Account.BillingState + ", " + record.Account.BillingPostalCode + "</a></li>";
		ul.append(eventItem);
	});
	$j("#calendar").trigger("create");
	$j.each(response.records, function(i, record) {
		var link = $j("#caseIdLink_" + record.What.Name);
		link.on('click', function(){setDetailCase(String(record.What.Name));});
	});
	
	var inString = "";
	for(x = 0; x < caseIds.length; x++)
	{
		inString = inString + "'" + caseIds[x] + "',";
	}
	inString = inString.substring(0,inString.length - 1);
	forcetkClient.query("Select Id, CaseNumber, Description, Status, Subject, Priority, ContactId, Contact.Name, Contact.Email, Contact.Phone, Account.Name, AccountId, Account.BillingStreet, Account.BillingCity, Account.BillingState, Account.BillingPostalCode, Device__c, Device__r.Name, Device__r.Model__c, Device__r.Serial_Number__c, (Select Id, Subject, StartDateTime from Events order by StartDateTime limit 1 ),(Select Id, Name, Quantity__c, Part__r.Name from Case_Parts__r) from Case where Id in (" + inString + ")",onSuccessSfdcCasesFromEvents, onErrorSfdc);

}

//Function to Upload a Photo Data to SFDC. Content is encoded as Base64 String for transmission to SFDC.
function uploadPhoto(data)
{
	$j.mobile.loading( 'show' );
	var attachmentRecord = {};
		attachmentRecord["Name"] = 'Photo.jpeg';
		attachmentRecord["Body"] = data;
		attachmentRecord["ContentType"] = "image/jpeg";
		attachmentRecord["ParentId"] = selectedCase.Id;
	    forcetkClient.insertRecord("Attachment",attachmentRecord,saveSuccess,saveError);
}

function saveSuccess(response)
{
	$j.mobile.loading( 'hide' );
	alert('Save Successful');
}

function saveError(response)
{
	$j.mobile.loading( 'hide' );
	alert('Error: ' + JSON.stringify(response));
}

function queryCaseBySerial(serialNumber)
{
	logToConsole('Serial Number :' + serialNumber);
	$j.mobile.loading( 'show' );
	forcetkClient.query("Select Id, CaseNumber, Description, Status, Subject, Priority, ContactId, Contact.Name, Contact.Email, Contact.Phone, Account.Name, AccountId, Account.BillingStreet, Account.BillingCity, Account.BillingState, Account.BillingPostalCode, Device__c, Device__r.Name, Device__r.Model__c, Device__r.Serial_Number__c, (Select Id, Subject, StartDateTime from Events order by StartDateTime limit 1 ),(Select Id, Name, Quantity__c, Part__r.Name from Case_Parts__r) from Case where Device_Serial__c = '" + serialNumber + "' Order By CreatedDate limit 1",onSuccessSfdcNFCScan, onErrorSfdc);
	//alert('Scanned Cases For Serial Number: ' + serialNumber);
	$.mobile.changePage( "../resources/us.html", { transition: "slideup", changeHash: false });
}



function onSuccessSfdcCasesFromEvents(response) {
	
	var $j = jQuery.noConflict();
	$j.mobile.loading( 'hide' );
    cordova.require("salesforce/util/logger").logToConsole("onSuccessSfdcCases: received " + response.totalSize + " cases");
    allCases = new Object();
    $j.each(response.records, function(i, record) {
    	   var scheduleTime = "";
    	   if(record.Events != null && record.Events != 'undefined' && typeof record.Events.records != 'undefined' && record.Events.records != null)
    	   {
    		   $j.each(record.Events.records, function(f, record1) {
    		   var date1 = new Date(record1.StartDateTime);
    		   var minutes = "00";
    		   if(date1.getMinutes() >= 10)
    		   {
    			minutes = date1.getMinutes();   
    		   }else
    		   {
    			   minutes = "0" + date1.getMinutes();
    		   }   
    		   scheduleTime = "Service: " + (date1.getMonth() + 1) + '/' + date1.getDate() + '/' + date1.getFullYear() + " at " + formatAMPM(date1);
    		   });
    	   }
           allCases[String(record.CaseNumber)] = record; //alert(JSON.stringify(record));
           });
    //alert(JSON.stringify(allCases));
}

//When the search on cases is successful, update DOM with the results from REST API and refresh to rerender (CREATE)
function onSuccessSfdcNFCScan(response) {
	
	var $j = jQuery.noConflict();
	$j.mobile.loading( 'hide' );
    cordova.require("salesforce/util/logger").logToConsole("onSuccessSfdcCases: received " + response.totalSize + " cases");
    allCases = new Object();
    $j.each(response.records, function(i, record) {
    	   var scheduleTime = "";
    	   if(record.Events != null && record.Events != 'undefined' && typeof record.Events.records != 'undefined' && record.Events.records != null)
    	   {
    		   $j.each(record.Events.records, function(f, record1) {
    		   var date1 = new Date(record1.StartDateTime);
    		   var minutes = "00";
    		   if(date1.getMinutes() >= 10)
    		   {
    			minutes = date1.getMinutes();   
    		   }else
    		   {
    			   minutes = "0" + date1.getMinutes();
    		   }   
    		   scheduleTime = "Service: " + (date1.getMonth() + 1) + '/' + date1.getDate() + '/' + date1.getFullYear() + " at " + formatAMPM(date1);
    		   });
    	   }   
           allCases[String(record.CaseNumber)] = record;
           setDetailCase(record.CaseNumber); 
           });
   
    $j.mobile.changePage($j("#service-case-details"), { transition: "slideup", changeHash: false });
}



function formatAMPM(date) {
	  var hours = date.getHours();
	  var minutes = date.getMinutes();
	  var ampm = hours >= 12 ? 'pm' : 'am';
	  hours = hours % 12;
	  hours = hours ? hours : 12; // the hour '0' should be '12'
	  minutes = minutes < 10 ? '0'+minutes : minutes;
	  var strTime = hours + ':' + minutes + ' ' + ampm;
	  return strTime;
	}


