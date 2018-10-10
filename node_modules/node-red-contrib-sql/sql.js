/**
 * Copyright 2015 mcarboni@redant.com
 *
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/



 module.exports = function(RED) {
    'use strict';
    var knex=require('knex');
    var querystring=require('querystring');

    // TODO: Complete type map for sqlite3
    // Convert the name from the sql form to a easier
    var typesMaps = {
            pg : [
                [ 'boolean'               , 'boolean'   ],
                [ 'character'             , 'string'    ],
                [ 'character varying'     , 'string'    ],
                [ 'text'                  , 'string'    ],
                [ 'date'                  , 'date'      ],
                [ 'time'                  , 'time'      ],
                [ 'timestamp'             , 'datetime'  ],
                [ 'bigint'                , 'integer'   ],
                [ 'bigserial'             , 'integer'   ],
                [ 'integer'               , 'integer'   ],
                [ 'smallint'              , 'integer'   ],
                [ 'smallserial'           , 'integer'   ],
                [ 'serial'                , 'integer'   ],
                [ 'double precision'      , 'double'    ],
                [ 'money'                 , 'double'    ],
                [ 'numeric'               , 'double'    ],
                [ 'real'                  , 'double'    ],
                [ 'USER-DEFINED'          , 'enum'      ]
            ],
            mysql : [
                [ 'boolean'               , 'boolean'   ],
                [ 'bool'                  , 'boolean'   ],
                [ 'char'                  , 'string'    ],
                [ 'varchar'               , 'string'    ],
                [ 'tinytext'              , 'string'    ],
                [ 'mediumtext'            , 'string'    ],
                [ 'longtext'              , 'string'    ],
                [ 'text'                  , 'string'    ],
                [ 'date'                  , 'date'      ],
                [ 'time'                  , 'time'      ],
                [ 'datetime'              , 'datetime'  ],
                [ 'timestamp'             , 'datetime'  ],
                [ 'bit'                   , 'integer'   ],
                [ 'tinyint'               , 'integer'   ],
                [ 'smallint'              , 'integer'   ],
                [ 'mediumint'             , 'integer'   ],
                [ 'int'                   , 'integer'   ],
                [ 'integer'               , 'integer'   ],
                [ 'bigint'                , 'integer'   ],
                [ 'decimal'               , 'double'    ],
                [ 'dec'                   , 'double'    ],
                [ 'numeric'               , 'double'    ],
                [ 'fixed'                 , 'double'    ],
                [ 'float'                 , 'double'    ],
                [ 'double'                , 'double'    ],
                [ 'double precision'      , 'double'    ],
                [ 'real'                  , 'double'    ],
                [ 'enum'                  , 'enum'      ],
                [ 'set'                   , 'set'       ]
            ]

        };

    RED.httpAdmin.get('/sqldb/:id',function(req,res) {
        var credentials = RED.nodes.getCredentials(req.params.id);
        if (credentials) {
            res.send(JSON.stringify({user:credentials.user,hasPassword:(credentials.password&&credentials.password!='')}));
        } else {
            res.send(JSON.stringify({}));
        }
    });

    RED.httpAdmin.delete('/sqldb/:id',function(req,res) {
        RED.nodes.deleteCredentials(req.params.id);
        res.send(200);
    });

    RED.httpAdmin.post('/sqldb/:id',function(req,res) {
        var body = '';
        req.on('data', function(chunk) {
            body+=chunk;
        });
        req.on('end', function(){
            var newCreds = querystring.parse(body);
            var credentials = RED.nodes.getCredentials(req.params.id)||{};
            if (newCreds.user == null || newCreds.user == '') {
                delete credentials.user;
            } else {
                credentials.user = newCreds.user;
            }
            if (newCreds.password == '') {
                delete credentials.password;
            } else {
                credentials.password = newCreds.password||credentials.password;
            }
            RED.nodes.addCredentials(req.params.id,credentials);
            res.send(200);
        });
    });

    function InjectPayload(msg,payload) {
        var result = {};
        for (var i in msg) {
            result[i] = msg[i];
        }
        result.payload = payload;
        return result;
    }

    function _getConnection(config) {
        switch (config.dialect) {
            case 'pg':
                var auth = {
                    user        :  config.user,
                    password    :  config.password,
                    host        :  config.hostname,
                    port        :  config.port,
                    database    :  config.db,
                    ssl         :  config.ssl
                };
                if (config.password) {
                    auth.password = config.password;
                }
                return knex({
                    client: 'pg',
                    connection: auth,
                    pool: {
                        min: config.minPool,
                        max: config.maxPool
                    },
                    debug: true
                });
            case 'mysql':
                return knex({
                    client: 'mysql',
                    connection: {
                        user        :  config.user,
                        password    :  config.password,
                        host        :  config.hostname,
                        database    :  config.db
                    },
                    pool: {
                        min: config.minPool,
                        max: config.maxPool
                    },
                    debug: true
                });
            case 'sqlite3':
                return knex({
                    client: 'sqlite3',
                    connection: {
                        filename    :  config.filename
                    },
                    debug: true
                });
        }

    }

    // TODO: Get enum values for  sqlite3
    function getEnumValues(connection,schema,typename,dialect) {
        switch (dialect) {
            case 'pg':
                return connection.raw('select e.enumlabel as enum_value from pg_type t join pg_enum e on t.oid = e.enumtypid join pg_catalog.pg_namespace n ON n.oid = t.typnamespace AND n.nspname = ? WHERE t.typname = ?',[schema,typename]);
        }
        return ;
    }

    // TODO: Get table columns for sqlite3
    function getColumns(connection,table,dialect,database) {
        return new Promise(function(resolve, reject) {
            switch (dialect) {
                case 'pg':
                    return connection.raw('SELECT column_name as name,data_type as type,udt_name,udt_schema FROM information_schema.columns WHERE table_schema = current_schema AND table_name  = ?',[table]).then(function (result) {
                        var finished = 0;
                        var results = result.rows;
                        for (var i = 0; i < results.length; i++) {
                            var possibleType = typesMaps[dialect].filter(function (type) {
                                                    return ~results[i].type.indexOf(type[0]);
                                                });
                            possibleType = possibleType.reduce(function (returned,value) {
                                                return value[0].length>returned[0].length
                                                        ? value
                                                        : returned;
                                            },['','']);
                            if (possibleType) {
                                results[i].typeName = possibleType[1];
                                if ( results[i].typeName === 'enum' ) {
                                    finished++;
                                    (function (id) {
                                        getEnumValues(connection,results[id].udt_schema,results[id].udt_name,dialect).then(function (enumresults) {
                                            results[id].values = enumresults.rows.map(function (a) {
                                                return a.enum_value;
                                            });
                                            finished--;
                                            if (finished === 0) {
                                                resolve(results);
                                            }
                                        },reject);
                                    })(i);
                                }
                            }
                            delete results[i].udt_name;
                            delete results[i].udt_schema;
                        }
                        if (finished === 0) {
                            resolve(results);
                        }
                    },reject);
                case 'mysql':
                    return connection.raw('SELECT column_name as name,data_type as type,character_maximum_length, column_type, data_type FROM information_schema.columns WHERE TABLE_SCHEMA = ? AND table_name = ?',[database,table]).then(function (result) {
                        var results = result.rows;
                        for (var i = 0; i < results.length; i++) {
                            var possibleType = typesMaps[dialect].filter(function (type) {
                                                    return ~results[i].type.indexOf(type[0]);
                                                });
                            possibleType = possibleType.reduce(function (returned,value) {
                                                return value[0].length>returned[0].length
                                                        ? value
                                                        : returned;
                                            },['','']);
                            if (possibleType) {
                                results[i].typeName = possibleType[1];
                                if (( results[i].typeName === 'enum' ) || (results[i].typeName === 'set')) {
                                    var regRes = results[i].column_type.match(/^.*\((.*)\)$/);
                                    if (regRes && ( regRes.length > 1 ) ) {
                                        //Possible security break :
                                        results[i].values = eval('['+regRes[1]+']');
                                    }
                                }
                            }
                            delete results[i].column_type;
                        }
                        resolve(results);
                    },reject);
            }
        });
    }

    RED.httpAdmin.post('/sqldb/test/connection',function (req,res) {

    });

    function SqlDatabaseNode(n) {
        var node = this;

        RED.nodes.createNode(this,n);

        this.dialect = n.dialect;
        this.filename = n.filename;
        this.hostname = n.hostname;
        this.port = n.port;
        this.db = n.db;
        this.ssl = n.ssl;
        this.minPool = n.minpool || 0;
        this.maxPool = n.maxpool || 2;

        var credentials = this.credentials;
        if (credentials) {
            this.user = credentials.user;
            this.password = credentials.password || '';
        }

        this.connection = _getConnection(this);



        RED.httpAdmin.get('/sqldb/'+n.id+'/tables',function(req,res) {
            // TODO: Test list of the tables for mysql and sqlite3
            switch (n.dialect) {
                case 'pg':
                    return node.connection.raw('SELECT table_name FROM INFORMATION_SCHEMA.TABLES WHERE "table_schema" = current_schema').then(function (results) {
                        res.json(results.rows.map(function (rw) {
                            return [rw.table_name];
                        }));
                    },function (err) {
                        console.error(err);
                        res.status(500).json(err);
                    });
                case 'mysql':
                    return node.connection.raw('SELECT table_name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',[n.db]).then(function (results) {
                        res.json(results.rows.map(function (rw) {
                            return [rw.table_name];
                        }));
                    },function (err) {
                        console.error(err);
                        res.status(500).json(err);
                    });
                case 'sqlite3':
                    return node.connection.raw('SELECT name FROM sqlite_temp_master WHERE type="table"').then(function (results) {
                        res.json(results.rows.map(function (rw) {
                            return [rw.name];
                        }));
                    },function (err) {
                        console.error(err);
                        res.status(500).json(err);
                    });
                default :
                    res.sendStatus(400);
            }
        });

        RED.httpAdmin.get('/sqldb/'+n.id+'/:table/columns',function(req,res) {
            getColumns(node.connection,req.params.table,n.dialect,n.db).then(function (columns) {
                res.json(columns);
            },function (err) {
                console.error(err);
                res.status(500).json(err);
            });
        });
    }

    function SqlArrayNode(n) {
        var node=this;
        RED.nodes.createNode(this,n);

        try {
            this.columns = JSON.parse(n.columns);
        } catch (e) {
            node.error(e.message);
            this.columns = [];
        }
    }

    function parseSingleValue(value,type,node,msg) {
        switch (type) {
            case 'msg':
                //Find the message
                return value.split('.').reduce(function (obj, i) {
                    return (typeof obj === 'object')
                            ? obj[i]
                            : obj;
                }, msg);
            case 'flow':
                return node.context().flow.get(value);
            case 'global':
                return node.context().global.get(value);
            case 'str':
                return value;
            case 'num':
                return parseFloat(value,10);
        }
    }

    function parseValue(val,type,node,msg,operator) {
        if (Array.isArray(val)) {
            if (val.length === type.length) {
                //For every value use the type
                for (var i=0,l=val.length;i<l;i++) {
                    val[i] = parseSingleValue(val[i],type[i],node,msg);
                }
            }
        } else if (type.length === 1) {
            return parseSingleValue(val,type[0],node,msg);
        }
        if (!~['in','not in'].indexOf(operator) && Array.isArray(val)) {
            val = val[0];
        }
        return val;
    }

    var operators = {
        equal           : '=',
        not_equal       : '!=',
        in              : 'in',
        not_in          : 'not in',
        less            : '<',
        less_or_equal   : '<=',
        greater         : '>',
        greater_or_equal: '>='
    };

    function constructWhereField(query,obj,condition,node,msg) {
        if (obj.condition) {
            switch (condition) {
                case '' :
                    query.where(constructWhere(obj,node,msg));
                break;
                case 'AND' :
                    query.andWhere(constructWhere(obj,node,msg));
                break;
                case 'OR' :
                    query.orWhere(constructWhere(obj,node,msg));
                break;
            }
        } else {
            switch (obj.operator) {
                case 'between' :
                    switch (condition) {
                        case '' :
                            query.whereBetween(obj.field,parseValue(obj.value,obj.data.type,node,msg));
                        break;
                        case 'AND' :
                            query.andWhereBetween(obj.field,parseValue(obj.value,obj.data.type,node,msg));
                        break;
                        case 'OR' :
                            query.orWhereBetween(obj.field,parseValue(obj.value,obj.data.type,node,msg));
                        break;
                    }
                break;
                case 'not_between' :
                    switch (condition) {
                        case '' :
                            query.whereNotBetween(obj.field,parseValue(obj.value,obj.data.type,node,msg));
                        break;
                        case 'AND' :
                            query.andWhereNotBetween(obj.field,parseValue(obj.value,obj.data.type,node,msg));
                        break;
                        case 'OR' :
                            query.orWhereNotBetween(obj.field,parseValue(obj.value,obj.data.type,node,msg));
                        break;
                    }
                break;
                case 'is_null' :
                    switch (condition) {
                        case '' :
                            query.whereNull(obj.field);
                        break;
                        case 'AND' :
                            query.andWhereNull(obj.field);
                        break;
                        case 'OR' :
                            query.orWhereNull(obj.field);
                        break;
                    }
                break;
                case 'is_not_null' :
                    switch (condition) {
                        case '' :
                            query.whereNotNull(obj.field);
                        break;
                        case 'AND' :
                            query.andWhereNotNull(obj.field);
                        break;
                        case 'OR' :
                            query.orWhereNotNull(obj.field);
                        break;
                    }
                break;
                default :
                    switch (condition) {
                        case '' :
                            query.where(obj.field,operators[obj.operator],parseValue(obj.value,obj.data.type,node,msg,operators[obj.operator]));
                        break;
                        case 'AND' :
                            query.andWhere(obj.field,operators[obj.operator],parseValue(obj.value,obj.data.type,node,msg,operators[obj.operator]));
                        break;
                        case 'OR' :
                            query.orWhere(obj.field,operators[obj.operator],parseValue(obj.value,obj.data.type,node,msg,operators[obj.operator]));
                        break;
                    }
                break;
            }
        }
        return query;
    }

    function constructWhere(clause,node,msg) {
        return function () {
            if (clause.rules.length) {
                var query = constructWhereField(this,clause.rules[0],'',node,msg);
                for (var i=1,l=clause.rules.length;i<l;i++) {
                    constructWhereField(query,clause.rules[i],clause.condition,node,msg);
                }
            }
        };
    }


    function SqlWhereNode(n) {
        var node = this;
        RED.nodes.createNode(this,n);
        this.name = n.name;

        try {
            this.clause = JSON.parse(n.clause);
            this.getQuery = function (baseQuery,node,msg) {
                if (n.clause === '{}') {
                    return baseQuery;
                }
                return baseQuery.where(constructWhere(this.clause,node,msg));
            };
        } catch (e) {
            node.error(e.message);
            this.clause = {};
        }
    }


    RED.nodes.registerType('sqldb',SqlDatabaseNode,{
            credentials: {
                user: {type:'text'},
                password: {type: 'password'}
            }
        });

    RED.nodes.registerType('sqlarray',SqlArrayNode);

    RED.nodes.registerType('sqlwhere',SqlWhereNode);

    function _prepareColumns(payload,columns) {
        var allColumns = columns.length === 0;
        if ((typeof payload !== 'object') || (payload === null) || (Array.isArray(payload))) {
            throw new Error('Invalid payload type '+(typeof payload));
        }
        var cols = {},
            ok = true;
        for (var key in payload) {
            if (payload.propertyIsEnumerable(key)) {
                if ( allColumns || ( columns.indexOf(key.toLowerCase()) !== -1)) {
                    if (typeof payload[key] !== 'object') {
                        cols[key.toLowerCase()] = payload[key];
                    } else {
                        throw new Error('Invalid property type '+typeof payload[key]+'\n'+JSON.stringify(payload[key],null,4));
                    }
                }
            }
        }
        if (ok) {
            return cols;
        }
    }

    function SqlNodeInsert(n) {
        var node = this;

        RED.nodes.createNode(this,n);

        this.allColumns = n.columns.length === 0;
        this.sqlConfig = RED.nodes.getNode(n.sqldb);
        this.columns = RED.nodes.getNode(n.columns).columns;
        this.requireAll = n.requireAll;
        this.table = n.table;

        this.on('input',function (msg) {
            try {
                var cols = _prepareColumns(msg.payload,node.columns);
                if ( !node.requireAll || (node.columns.length === Object.keys(cols).length ) ) {
                    //Build query
                    node.sqlConfig.connection
                        (node.table).insert(cols).then(function (result) {
                            node.send(InjectPayload(msg,result));
                        }).catch(function (e) {
                            node.error(e);
                        });
                } else {
                    node.error('One or more columns are missing');
                }
            } catch (e) {
                node.error(e.message);
            }
        });
    }

    function SqlNodeUpdate(n) {
        var node = this;

        RED.nodes.createNode(this,n);

        this.allColumns = n.columns.length === 0;
        this.sqlConfig = RED.nodes.getNode(n.sqldb);
        this.columns = RED.nodes.getNode(n.columns).columns;
        this.where = RED.nodes.getNode(n.where);
        this.requireAll = n.requireAll;
        this.table = n.table;

        this.on('input',function (msg) {
            try {
                var cols = _prepareColumns(msg.payload,node.columns);
                if ( !node.requireAll || (node.columns.length === Object.keys(cols).length ) ) {
                    //Build query
                    var query = node.sqlConfig.connection(node.table).update(cols);
                    //Make Where
                    try {
                        node.where.getQuery(query,node,msg);
                    } catch (e) {
                        node.error('One or more columns are missing in the where');
                    }
                    query.then(function (rows) {
                        node.send(InjectPayload(msg,rows));
                    }).catch(function (e) {
                        node.error(e);
                    });
                } else {
                    node.error('One or more columns are missing');
                }
            } catch (e) {
                node.error(e.message);
            }
        });
    }

    function SqlNodeSelect(n) {
        var node = this;

        try {
            RED.nodes.createNode(this,n);

            this.allColumns = n.columns.length === 0;
            this.sqlConfig = RED.nodes.getNode(n.sqldb);
            this.columns = RED.nodes.getNode(n.columns).columns;
            this.where = RED.nodes.getNode(n.where);
            this.group = RED.nodes.getNode(n.group).columns;
            this.order = RED.nodes.getNode(n.order).columns;
            this.orderdir = n.orderdir;
            this.table = n.table;
            this.limit = n.limit || 0;
            this.offset = n.offset || 0;

            node.on('input',function (msg) {
                try {
                    //Build query
                    var query = node.sqlConfig.connection(node.table),
                        limit = parseInt(node.limit),
                        offset = parseInt(node.offset),
                        group = node.group,
                        order = node.order;

                    //Make Where
                    try {
                        node.where.getQuery(query,node,msg);
                    } catch (e) {
                        node.error('One or more columns are missing');
                    }

                    if (!limit || isNaN(limit))  {
                        limit = msg.limit ? parseInt(msg.limit) : 0;
                    }

                    if (!offset || isNaN(offset))  {
                        offset = msg.offset ? parseInt(msg.offset) : 0;
                    }

                    query = (node.allColumns ? query.select() : query.select(node.columns));

                    if (limit && !isNaN(limit)) {
                        query = query.limit(limit);
                    }

                    if (offset && !isNaN(offset)) {
                        query = query.offset(offset);
                    }

                    if (group.length) {
                        query = query.groupBy(group);
                    }

                    if (order.length) {
                        query = query.orderBy(order,node.orderdir);
                    }

                    query.then(function (rows) {

                        node.send(InjectPayload(msg,rows));
                    }).catch(function (e) {
                        node.error(e);
                    });
                } catch (e) {
                    node.error(e.message);
                }
            });
        } catch(e) {
            console.error(e);
        }

    }

    function SqlNodeDelete(n) {
        var node = this;

        try {
            RED.nodes.createNode(this,n);

            this.allColumns = n.columns.length === 0;
            this.sqlConfig = RED.nodes.getNode(n.sqldb);
            this.where = RED.nodes.getNode(n.where);
            this.table = n.table;
            this.limit = n.limit || 0;

            node.on('input',function (msg) {
                try {
                    //Build query
                    var query = node.sqlConfig.connection(node.table),
                        limit = parseInt(node.limit);

                    //Make Where
                    try {
                        node.where.getQuery(query,node,msg);
                    } catch (e) {
                        node.error('One or more columns are missing in the where');
                    }

                    if (!limit || isNaN(limit))  {
                        limit = msg.limit ? parseInt(msg.limit) : 0;
                    }

                    if (limit && !isNaN(limit)) {
                        query = query.limit(limit);
                    }

                    query.del().then(function (rows) {
                        node.send(InjectPayload(msg,rows));
                    }).catch(function (e) {
                        node.error(e);
                    });
                } catch (e) {
                    node.error(e.message);
                }
            });
        } catch(e) {
            console.error(e);
        }

    }

    RED.nodes.registerType('SQL Insert',SqlNodeInsert);
    RED.nodes.registerType('SQL Update',SqlNodeUpdate);
    RED.nodes.registerType('SQL Select',SqlNodeSelect);
    RED.nodes.registerType('SQL Delete',SqlNodeDelete);
};
