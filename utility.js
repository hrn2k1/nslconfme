 
function Nullify(objval)
{
    return !objval?null:objval;
}

function convertToDateTime(date,time)
{
    var times=time.split(",");
var strDateTime=date+" "+times[0]+" "+times[2].replace(")","");
var dt=new Date(strDateTime);
return dt;
}
 function generateUid(separator) {
    /// <summary>
    ///    Creates a unique id for identification purposes.
    /// </summary>
    /// <param name="separator" type="String" optional="true">
    /// The optional separator for grouping the generated segmants: default "-".    
    /// </param>

    var delim = separator || "-";

    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
};

exports.Nullify=Nullify;
exports.generateUid=generateUid;
exports.convertToDateTime=convertToDateTime;