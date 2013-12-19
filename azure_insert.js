function insert(item, user, request) {
    console.log('inserting new item ', item);

    var STORAGE_ACCOUNT_NAME = "confme";
    var STORAGE_ACCOUNT_KEY = "2z+ki/6U8yUwraWWhhfZZrrKLYpQWyJxM8gVXpA3F0e8BUmgir2BCdOU15S88YeyCmioXetW0lgEL86gOqepNg==";
    var TABLE_NAME = "confmeTable";

    console.log('loading azure');
    var azure = require('azure');
    console.log('azure loaded');
    var tableService = azure.createTableService(STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY);
    console.log('connected to table service');

    tableService.createTableIfNotExists(TABLE_NAME, function(error) {
        if (error) {
            console.error('createTableIfNotExists() error: ' + error);
            request.respond(statusCodes.BAD_REQUEST, error); 
            return;
        }
    });

    var entity = {
        PartitionKey :  user.userId || 'default',
        RowKey : item.timestamp,
        URI : item.uri
    };

    tableService.insertEntity(TABLE_NAME, entity, function(error) {
        if (error) {
            console.error('insertEntity() error: ' + error);
            request.respond(statusCodes.BAD_REQUEST, error);
            return;
        }
        //request.respond(statusCodes.OK, item);
        request.execute();
    });
}
