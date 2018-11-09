# API Gateway

### ❌ Current status: Stub! Work in progress! ❌

#### API Gateway-pattern inspired webservice for Kubernetes-hosted microservices. Highly dependent on the Event-service (coming soon).

## Purpose

The main purposes of the API Gateway are:

- Stateless API gateway with no database dependency.
- To act as the primary proxy and gateway to the underlying microservices, which are then only accessible via this service.
- Allow multiple protocols: REST with JSON as well as all protocols supported by Socket.io (Websockets, JSONP Long Polling and more).
- Light-weight Javascript-client based on Socket.io for highly optimized remote calls, exposing regular Promise-style request/response-cycles, similar to jQuery's AJAX-methods.
- Communicates with underlying webservices using a consistent REST with JSON-format.
- Intentionally has no domain knowledge whatsoever.
- Passes every call on as events, to the Events-service.

## Getting started

Either compile and run with Docker, or just run straight off using NodeJS. Supports `.env` as well as regular environment variables, of which the latter has precedence.

By default this NodeJS server binds to port `60000`.

It is required to provide the following environment variables:

-  `SYSEVENT`: tells the API Gateway where the Event-server the IP/hostname and port of the Event-server.

### Docker approach (recommended)

Start by compiling into an image - we prefix the system-parts, ie. non domain related services, with `sys`, but do as suits you best:

```bash
docker build -t sys-apigateway .
```

To run you would simply do:

```shell
docker run -p 8080:60000 -d -e SYSEVENT="127.0.0.1:60010" sys-apigateway
```

Which would run the service and expose it on port 8080 on your machine.

### Vanilla NodeJS

The service is tested and known to work with the NodeJS v10-branch. It will probably work with any version after NodeJS 8.4, though we give no guarantees.

To get started, install the dependencies:

```shell
npm install
```

Then to run the service:

```bash
SYSEVENT="127.0.0.1:60010" npm start -l tcp://127.0.0.1:8080
```

Which will run the webservice on port 8080, bound to the loopback interface. The `-l`-argument also supports UNIX domain sockets, ie. `unix:/path/to/socket.sock` and Windows named pipes, ie. `pipe:\\.\pipe\PipeName`.

## Documentation

### Protocol

Regardless of how you decide to communicate with the server, be it via REST and JSON or using one of the streaming protocols (Websockets, Long-polling etc.), the server always expects the incoming to be of the same structure. The replies will always be in JSON.

The general structure of successful responses are:

```javascript
{
    status: 200, // status code
    body: {}, // can be of any type - the full response of the underlying service. if null, then body is ommited and status 204 is used instead
}
```

In case of errors, the structure is:

```javascript
{
    status: 422, // status code
    error_code: "VALIDATION_FAILED", // generic error code
    error_details: {}, // key-value pair with error information - useful for generating i18ed messages
    error_message: "The data could not be validated", // humanly understandable error message in english. Mostly intended for debugging purposes.
}
```

### Status-codes

The following status codes are used.

| Status-code | Explanation                                                  |
| ----------- | ------------------------------------------------------------ |
| 200         | Request went as expected.                                    |
| 204         | Request went as expected, no payload (often seen with DELETE). |
| 400         | The request is malformatted. Request cancelled at the API Gateway. |
| 410         | Not service: No underlying service responded to the request. |
| 401         | Authorization required (none provided).                      |
| 403         | Forbidden: The authorization given, does not cover the request. |
| 422         | Unprocessable: Typically due to validation in a service failing. |
| 500         | Something unexpected went wrong.                             |

### Standard REST-communication

Communicate with the underlying services by entering the path of the service straight into the path.

If the request requires authorization, then please add an `Authorization`-header using `Bearer ACCESS-TOKEN`-type, ie:

```http
Authorization: Bearer Abee56mao4e5b453l6k456mxasdf
```

If the request has a minimum amount of data, the data can be JSON + URI-encoded into the variable `r=` and be sent via GET, for instance the arguments `{"get_post":12345}` would end up as following:

`http://localhost:60010/my-service/sub-endpoint?r=%7B%22get_post%22%3A12345%7D`

The same could be achieved by POST-ing the raw JSON-content to the same path, but without query arguments, ie:

```http
http://localhost:60010/my-service/sub-endpoint

{"get_post":12345}
```

### Using the Javascript-client

**We clearly recommend this approach in web-applications!**

Install the following script in your website. It has no external dependencies.

```html
<script src="http://localhost:60010/agw.js"></script>
```

Before using the library in your webapp, you need to initialize it by telling it where the API Gateway is located. You do this by writing:

```javascript
agw.connect('http://localhost:60010');
```

You will then immediately be able to start calling the API. Any calls you initiate before a connection has been established, will simply queue up and execute automatically once a connection is established.

To call the service using the Javascript-client, simply call `agw` with the arguments in the following order:

- Path: The path of the underlying service, for instance `my-service/sub-endpoint`.
- Request (optional): Plain Javascript-object.

The call returns a Promise. When a Promise is **resolved**, the argument contains the body - or null, if empty but succesful request. When a Promise is **rejected**, the entire error document is returned, ie. with the properties `status`, `error_code`, `error_details` etc. present.

For example:

```javascript
var request = agw('my-service/sub-endpoint', {r: 12345});
request.then(function(response) {
    console.log('Success! Response from server: ', response);
});
request.catch(function(error) {
    console.error('Failure. Status code: ' + error.status + ', code: ' + error.error_code)
});
```

