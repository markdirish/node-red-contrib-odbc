# node-red-contrib-odbc

A Node-RED node for making queries and calling procedures through an ODBC connection. Uses the [`odbc`](https://www.npmjs.com/package/odbc) package as the database connector.

---
## Installation

There are two ways to download this package:

1. From the Node-RED ediot menu, select `Manage pallete`, then click the `Install` tab and search for this package.

2. In your Node-RED user directory (usually ~/.node-red/), download through the `npm` utility:
    ```
    npm install node-red-contrib-odbc
    ```

For the `odbc` connector requirements, please see [the documentation for that package](https://www.npmjs.com/package/odbc#requirements).

---
## Usage

`node-red-contrib-odbc` provides three nodes:

* **`ODBC pool`**: A configuration node for defining your connection string and managing your connections
* **`ODBC query`**: A node for running queries with or without parameters
* **`ODBC procedure`**: A node for calling procedures and functions

### `ODBC pool`

A configuration node that manages connections in an `odbc.Pool` object. [Can take any configuration property recognized by `odbc.pool()`](https://www.npmjs.com/package/odbc#constructor-odbcpoolconnectionstring). The connection pool will initialize the first time a `ODBC query` node or `ODBC pool` node runs.

#### Properties

* (**required**) **`connectionString`**: <`string`>

  An ODBC connection string that defines your DSN and/or connection string options

  Example:
  ```
  DSN=MyDSN;DFT=2;
  ```
* (optional) **`initialSize`**: <`number`>

  The number of connections created in the Pool when it is initialized

* (optional) **`incrementSize`**: <`number`>

  The number of connections that are created when the pool is exhausted

* (optional) **`maxSize`**: <`number`>

  The maximum number of connections allowed in the pool before it won't create any more

* (optional) **`shrinkPool`**: <`boolean`>

  Whether the number of connections should be reduced to `initialSize` when they are returned to the pool

* (optional) **`connectionTimeout`**: <`number`>

  The number of seconds for a connection to remain idle before closing

* (optional) **`loginTimeout`**: <`number`>

  The number of seconds for an attempt to create a connection before returning to the application

### `ODBC query`

A node that runs a query when input is received. This node can define its own query string and/or parameters, as well as take a query and/or parameters as input. Input values will override any node properties.

#### Properties

* (**required**) **`connection`**: <`ODBC pool`>

  The ODBC pool node that defines the connection settings and manages the connection pool used by this node

* (optional) **`query`**: <`string`>

  A query string that can optionally contain parameter markers

* (optional) **`parameters`**: <`array<any>`>

  The parameters to bind to the query string, passed as a JavaScript array. If this property is set with the Node-RED editor, it is a valid JSON string that will be converted to JavaScript.

#### Inputs

The `ODBC query` node accepts a `payload` input that is either a valid JSON string or a JavaScript object with `"query"` and/or `"parameters"` properties. These values, when passed on the payload, override node properties.

* (optional) **`payload.query`** <`string`>:

  A query string that can optionally contain parameter markers

* (optional) **`payload.parameters`**: <`array<any>`>

  The parameters to bind to the query string. This is either an array in a JSON string, or a JavaScript array.

#### Outputs

Sends a message with a `payload` that is the results from the query

* **`payload`**: <`array`>

  The [`odbc` Result array](https://www.npmjs.com/package/odbc#result-array) returned from the query.

### `ODBC procedure`

A node that calls a procedure when input is received. This node can define its own set of `catalog`, `schema`, `procedure`, and `parameters` to pass to the procedure, as well as take these values as input. Input values will override any node properties.

#### Properties

* (**required**) **`connection`**: <`ODBC pool`>

  The ODBC pool node that defines the connection settings and manages the connection pool used by this node

* (optional) **`catalog`**: <`string`>

  The catalog that contains the procedure

* (optional) **`schema`**: <`string`>

  The schema that contains the procedure

* (optional) **`procedure`**: <`string`>

  The name of the procedure

* (optional) **`parameters`**: <`array<any>`>

  The parameters to send and/or return from the procedure, passed as a JavaScript array. If this property is set with the Node-RED editor, it is a valid JSON string that will be converted to JavaScript.

#### Inputs

The `ODBC procedure` node accepts a `payload` input that is either a valid JSON string or a JavaScript object with `"catalog"`, `"schema"`, `"procedure"` and/or `"parameters"` properties. These values, when passed on the payload, override node properties.

* (optional) **`payload.catalog`** <`string`>:

  The catalog that contains the procedure

* (optional) **`payload.schema`** <`string`>:

  The schema that contains the procedure

* (optional) **`payload.procedure`** <`string`>:

  The name of the procedure

* (optional) **`payload.parameters`**: <`array<any>`>

  The parameters to bind to the query string. This is either an array in a JSON string, or a JavaScript array.

**Examples:**

* JSON string:

  `"{"catalog": null, "schema": "MY_SCHEMA", "procedure": "MYPROC", "parameters": [null, 123, "value"]}"`

* JavaScript object:

  `{ catalog: null, schema: "MY_SCHEMA", procedure: "MYPROC", parameters: [null, 123, "value] }`


#### Outputs

Sends a message with a `payload` that is the results of the procedure call

* **`payload`**: <`array`>

  The [`odbc` Result array](https://www.npmjs.com/package/odbc#result-array) returned from the procedure call.