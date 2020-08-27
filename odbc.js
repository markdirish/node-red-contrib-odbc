// Copyright 2020 IBM

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

module.exports = function(RED) {
  const odbc = require('odbc');

  function odbcPool(config) {
    RED.nodes.createNode(this, config);

    // Pass a poolConfig object to the odbc.pool function. If the values are not
    // set on the config object, they will get set to `undefined`, in which case
    // odbc.pool will set them to the defaults during its execution.
    this.poolConfig = config;
    this.pool = null;

    this.connect = async () => {

      let connection;

      if (this.pool == null) {
        try {
          this.pool = await odbc.pool(this.poolConfig);
        } catch (error) {
          throw(error);
        }
      }

      try {
        connection = await this.pool.connect();
      } catch (error) {
        throw(error);
      }

      return connection;
    }
  }
  
  RED.nodes.registerType('ODBC Pool', odbcPool);

  function odbcQuery(config) {
    RED.nodes.createNode(this, config);
    this.poolNode = RED.nodes.getNode(config.connection);
    this.queryString = config.query;
    this.outfield = config.outField;
    
    this.on('input', async (message, send, done) => {
      let connection;
      try {
        connection = await this.poolNode.connect();
      } catch (error) {
        if (error) {
          this.error(error);
          this.status({fill: "red", shape: "ring", text: error.message});
          if (done) {
            // Node-RED 1.0 compatible
            done(error);
          } else {
            // Node-RED 0.x compatible
            node.error(error, message);
          }
        }
      }

      this.status({
        fill:"blue",
        shape:"dot",
        text:"querying..."
      });

      let parameters = undefined;
      let result;

      // Check if there is a payload.
      // If yes, obtain the query and/or parameters from the payload
      // If no, use the node's predefined query
      if (message.payload) {

        // If the payload is a string, convert to JSON object and get the query
        // and/or parameters
        if (typeof message.payload == 'string')
        {
          let payloadJSON;
          try {
            // string MUST be valid JSON, else fill with error.
            // TODO: throw error?
            payloadJSON = JSON.parse(message.payload);
          } catch (error) {
            this.status({fill: "red", shape: "ring", text: error.message});
            connection.close();
            if (done) {
              // Node-RED 1.0 compatible
              done(error);
            } else {
              // Node-RED 0.x compatible
              node.error(error, message);
            }
          }
          parameters = payloadJSON.parameters || undefined;
          this.queryString = payloadJSON.query || this.queryString;
        } 
        
        // If the payload is an object, get the query and/or parameters directly
        // from the object
        else if (typeof message.payload == 'object') {
          parameters = message.payload.parameters || undefined;
          this.queryString = message.payload.query || this.queryString;
        }
      }

      try {
        result = await connection.query(this.queryString, parameters);
      } catch (error) {
        this.error(error);
        this.status({fill: "red", shape: "ring", text: error.message});
        connection.close();
        if (done) {
          // Node-RED 1.0 compatible
          done(error);
        } else {
          // Node-RED 0.x compatible
          node.error(error, message);
        }
      }

      connection.close();

      message.payload = result;
      send(message);
      connection.close();
      this.status({fill:'green',shape:'dot',text:'ready'});
      if (done) {
        done();
      }
    });

        
    this.status({fill:'green',shape:'dot',text:'ready'});
  }

  RED.nodes.registerType("ODBC query", odbcQuery);

  function odbcProcedure(config) {
    RED.nodes.createNode(this, config);
    this.poolNode = RED.nodes.getNode(config.connection);
    this.catalog = config.catalog;
    this.schema = config.schema;
    this.procedure = config.procedure;
    this.parameters = config.parameters;
    this.outfield = config.outField;

    // If parameters were passed in through the config, they are a string.
    // Need to convert the string to an actual JavaScript array
    if (this.parameters) {
      try {
        this.parameters = JSON.parse(this.parameters);
      } catch (error) {
        this.status({fill:'red',shape:'ring',text: error.message});
        return;
      }
    }

    // If catalog evaluates to false, convert the value to null, as the
    // odbc connector expects
    if (!this.catalog) {
      this.catalog = null;
    }

    // If schema evaluates to false, convert the value to null, as the
    // odbc connector expects
    if (!this.schema) {
      this.schema = null;
    }
    
    this.on('input', async (message, send, done) => {

      let connection;
      let catalog = this.catalog;
      let schema = this.schema;
      let procedure = this.procedure;
      let parameters = this.parameters;

      try {
        connection = await this.poolNode.connect();
      } catch (error) {
        if (error) {
          this.error(error);
          this.status({fill: "red", shape: "ring", text: error.message});
          if (done) {
            // Node-RED 1.0 compatible
            done(error);
          } else {
            // Node-RED 0.x compatible
            node.error(error, message);
          }
        }
      }

      this.status({
        fill:"blue",
        shape:"dot",
        text:"running procedure..."
      });

      let result;
      const payload = message.payload;

      // Check if there is a payload.
      // If yes, obtain the catalog, schema, table and/or parameters from the 
      // payload
      // If no, use the node's predefined values
      if (payload) {

        // If the payload is a string, convert to JSON object and get the
        // catalog, schema, table, and/or parameters.
        if (typeof payload == 'string')
        {
          let payloadJSON;
          try {
            // string MUST be valid JSON, else fill with error.
            // TODO: throw error?
            payloadJSON = JSON.parse(payload);
          } catch (error) {
            this.status({fill: "red", shape: "ring", text: error.message});
            connection.close();
            if (done) {
              // Node-RED 1.0 compatible
              done(error);
            } else {
              // Node-RED 0.x compatible
              node.error(error, message);
            }
          }
          catalog = payloadJSON.catalog || catalog;
          schema = payloadJSON.schema || schema;
          proceudre = payloadJSON.procedure || procedure;
          parameters = payloadJSON.parameters || parameters;
        } 
        
        // If the payload is an object, get the catalog, schema, table, and/or
        // parameters directly from the object
        else if (typeof payload == 'object') {
          catalog = payload.catalog || catalog;
          schema = payload.schema || schema;
          procedure = payload.procedure || procedure;
          parameters = payload.parameters || parameters;
        }
      }

      try {
        result = await connection.callProcedure(catalog, schema, procedure, parameters);
      } catch (error) {
        console.log(error.odbcErrors);
        this.error(error);
        this.status({fill: "red", shape: "ring", text: error.odbcErrors});
        connection.close();
        if (done) {
          // Node-RED 1.0 compatible
          done(error);
        } else {
          // Node-RED 0.x compatible
          node.error(error, message);
        }
      }

      connection.close();

      message.payload = result;
      send(message);
      connection.close();
      this.status({fill:'green',shape:'dot',text:'ready'});
      if (done) {
        done();
      }
    });

        
    this.status({fill:'green',shape:'dot',text:'ready'});
  }

  RED.nodes.registerType("ODBC procedure", odbcProcedure);
}