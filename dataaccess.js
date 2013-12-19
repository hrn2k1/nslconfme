var azure=require("azure");
var config=require('./config.js');
var utility=require('./utility.js');
function insertUser(response,deviceID,userID,firstName,lastName,phoneNo,masterEmail,password,otherEmail1,otherEmail2,otherEmail3,otherEmail4,location,registrationTime)
{
var TABLE_NAME="Users";	
var tableService = azure.createTableService(config.STORAGE_ACCOUNT_NAME, config.STORAGE_ACCOUNT_KEY);
tableService.createTableIfNotExists(TABLE_NAME, function(error) {
        if (error) {
            console.error('createTableIfNotExists() error: ' + error);
            //request.respond(statusCodes.BAD_REQUEST, error); 
            return;
        }
    });


  var entity = {
        PartitionKey : 'default',
        RowKey : utility.generateUid(),
        UserID : userID,
        DeviceID: deviceID,
        FirstName : firstName,
        LastName : lastName,
        PhoneNo : phoneNo,
        MasterEmail : masterEmail,
        Password : password,
        OtherEmail1 : otherEmail1,
        OtherEmail2 : otherEmail2,
        OtherEmail3 : otherEmail3,
        OtherEmail4 : otherEmail4,
        Location : location,
        RegistrationTime : registrationTime,
        IsBlackListed : false

    };

    tableService.insertEntity(TABLE_NAME, entity, function(error) {
        if (error) {
            console.error('insertUser() error: ' + error);
            //request.respond(statusCodes.BAD_REQUEST, error);
            
            response.setHeader("content-type", "text/plain");
            response.write('Error : ' + error);
            response.end();
        }
        else
        {
            response.setHeader("content-type", "text/plain");
            response.write('Success');
            response.end();
        }
        });
    
}

function insertPushURL(response,deviceID,userID,pushURL)
{
	var TABLE_NAME="PushURLs";	
var tableService = azure.createTableService(config.STORAGE_ACCOUNT_NAME, config.STORAGE_ACCOUNT_KEY);
tableService.createTableIfNotExists(TABLE_NAME, function(error) {
        if (error) {
            console.error('insertPushURL() error: ' + error);
            //request.respond(statusCodes.BAD_REQUEST, error);
            
            response.setHeader("content-type", "text/plain");
            response.write('Error : ' + error);
            response.end();
        }
        else
        {
            response.setHeader("content-type", "text/plain");
            response.write('Success');
            response.end();
        }
    });


  var entity = {
        PartitionKey : 'default',
        RowKey : utility.generateUid(),
        UserID : userID,
        DeviceID: deviceID,
        PushURL : pushURL,
        IsActive : true
    };

    tableService.insertEntity(TABLE_NAME, entity, function(error) {
        if (error) {
            console.error('insertPushURL() error: ' + error);
            //request.respond(statusCodes.BAD_REQUEST, error);
            return 'Error : ' + error;
        }
        });

    return 'Success';
}

function insertInvitation(userID,date,time,subject,toll,pin,accessCode,description)
{
	var TABLE_NAME="Invitations";	
var tableService = azure.createTableService(config.STORAGE_ACCOUNT_NAME, config.STORAGE_ACCOUNT_KEY);
tableService.createTableIfNotExists(TABLE_NAME, function(error) {
        if (error) {
            console.error('createTableIfNotExists() error: ' + error);
            //request.respond(statusCodes.BAD_REQUEST, error); 
            return;
        }
    });


  var entity = {
        PartitionKey : 'default',
        RowKey : utility.generateUid(),
        UserID : userID,
        Date : date,
        Time : time,
        Subject: subject,
        Toll:toll,
        PIN:pin,
        AccessCode:accessCode,
        Description:description
    };

    tableService.insertEntity(TABLE_NAME, entity, function(error) {
        if (error) {
            console.error('insertInvitation() error: ' + error);
            //request.respond(statusCodes.BAD_REQUEST, error);
            return 'Error : ' + error;
        }
        });

    return 'Success';
}
function insertInvitationEntity(entity)
{
    var TABLE_NAME="Invitations";   
var tableService = azure.createTableService(config.STORAGE_ACCOUNT_NAME, config.STORAGE_ACCOUNT_KEY);
tableService.createTableIfNotExists(TABLE_NAME, function(error) {
        if (error) {
            console.error('createTableIfNotExists() error: ' + error);
            //request.respond(statusCodes.BAD_REQUEST, error); 
            return;
        }
    });


  

    tableService.insertEntity(TABLE_NAME, entity, function(error) {
        if (error) {
            console.error('insertInvitation() error: ' + error);
            //request.respond(statusCodes.BAD_REQUEST, error);
            return 'Error : ' + error;
        }
        });

    return 'Success';
}
function getNotification(response)
{
    console.log(new Date(Date.parse('2013-12-12T06:13:16.189Z')));
	var TABLE_NAME="Invitations";	
	var tableService = azure.createTableService(config.STORAGE_ACCOUNT_NAME, config.STORAGE_ACCOUNT_KEY);
	var query = azure.TableQuery
    .select()
    .from(TABLE_NAME)
    .where('Timestamp gt ?', new Date(Date.parse('2013-12-12T06:13:16.189Z')));
    var invites={"Success":"OK"};
    tableService.queryEntities(query, function(error, entities){
    if(!error){
        //entities contains an array of entities
        console.log(entities);
        //return JSON.stringify(entities);
        response.setHeader("content-type", "text/plain");
         response.write(JSON.stringify(entities));
        response.end();
    }
    else
    {
    	 console.log(error);
    	invites = {"Error":error};
          response.setHeader("content-type", "text/plain");
         response.write(JSON.stringify(invites));
        response.end();
    }
});
    
}
 
   
exports.insertUser=insertUser;
exports.insertPushURL=insertPushURL;
exports.insertInvitation=insertInvitation;
exports.insertInvitationEntity=insertInvitationEntity;
exports.getNotification=getNotification;


