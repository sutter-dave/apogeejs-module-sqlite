//These are in lieue of the import statements
let {FormInputBaseComponent} = apogeeapp;

/** This is a simple custom component example. */
class SqliteQueryCell extends FormInputBaseComponent {
    constructor(member,modelManager,instanceToCopy,keepUpdatedFixed) {
        super(member,modelManager,instanceToCopy,keepUpdatedFixed);
    }
}

const DATA_MEMBER_FUNCTION_BODY = `
    return SqliteComponentModule.createQueryPromise(formResult);
`

FormInputBaseComponent.initializeClass(SqliteQueryCell,"SQLite Query Cell","apogeeapp.SqliteQueryCell",DATA_MEMBER_FUNCTION_BODY);

module.exports = SqliteQueryCell;


//==========================
// This is common code that is referenced by the modules. Here we store this
// in a global location so we can call it. 
//==========================

function getDbConnection(options) {
    //I had a problem where electron would crash if I tried to open a non existent file. This tries to fix that.
    var fs = require('fs');
    
    //load file if it exists
    if(fs.existsSync(options.dbPath)) {
        let sqlite3 = require('sqlite3');
        if(options.verboseOption) {
            sqlite3 = require('sqlite3').verbose();
        }
        else {
            sqlite3 = require('sqlite3');  
        }
        
        // open the database
        if(options.cached) {
             return new sqlite3.cached.Database(options.dbPath);
        }
        else {
            return new sqlite3.Database(options.dbPath);
        }
       
    }
    else { 
        throw new Error("DB file not found: " + dbPath);
    }
}

function createQueryPromise(options) {

    return new Promise( (resolve,reject) => {
        //validate inputs
        let queryType = options.queryType;
        if((queryType != "run")&&(queryType != "all")&&(queryType != "get")) {
            apogeeUserAlert("Invalid query type!");
            resolve(apogeeutil.INVALID_VALUE);
            return;
        }
        
        let sql = options.sql;
        if(!sql) {
            apogeeUserAlert("SQL missing!");
            resolve(apogeeutil.INVALID_VALUE);
            return;
        }
        
        let params = options.params;
        if(!params) params = [];
        
        if(!options.dbPath) {
            apogeeUserAlert("Database path missing!");
            resolve(apogeeutil.INVALID_VALUE);
            return;
        }
    
        // open the database
        let db = getDbConnection(options);
        
        //run statement
        switch(queryType) {
            case "run":
                db.run(sql, params, (err, rows) => {
                    try {
                        if(err) {
                            reject(err.toString());
                        }
                        else {
                            resolve("");
                        }
                    }
                    catch(error) {
                        if(error.stack) console.error(error.stack);
                        reject(error.toString());
                    }
                });
                break;
                
            case "all":
                db.all(sql, params, (err, rows) => {
                    try {
                        if(err) {
                            reject(err.toString());
                        }
                        else {
                            let data = [];
                            rows.forEach((row) => {
                                let entry = {};
                                for(let columnName in row) {
                                    entry[columnName] = row[columnName];
                                }
                                data.push(row);
                            });
                            resolve(data);
                        }
                    }
                    catch(error) {
                        if(error.stack) console.error(error.stack);
                        reject(error.toString());
                    }
                });
                break;
        
            case "get":
                db.get(sql, params, (err, row) => {
                    try {
                        if(err) {
                            reject(err.toString());
                        }
                        else {
                            let entry = {};
                            for(let columnName in row) {
                                entry[columnName] = row[columnName];
                            }
                            resolve(entry);
                        }
                    }
                    catch(error) {
                        if(error.stack) console.error(error.stack);
                        reject(error.toString());
                    }
                });
                break;
        }
        
        // close the database connection
        db.close();
    })
}

let SqliteComponentModule = {};
SqliteComponentModule.createQueryPromise = createQueryPromise;

__globals__.SqliteComponentModule = SqliteComponentModule;

