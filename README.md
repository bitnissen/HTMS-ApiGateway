# API Gateway

### ❌ Current status: Stub! Work in progress! ❌

#### API Gateway-pattern for efficiently proxying to our [Event-service](https://github.com/bitnissen/NodeJS-EventService/tree/master). Exposes the Event-service via regular REST as well as via Socket.io.

## Purpose

The main purposes of the API Gateway are:

- Stateless API gateway with no database dependency.
- To act as the primary proxy and gateway to the underlying microservices, which are then only accessible via this service.
- Allow multiple protocols: REST with JSON as well as all protocols supported by Socket.io (Websockets and Long Polling).
- Light-weight Javascript-client based on Socket.io for highly optimized remote calls, exposing regular Promise-style request/response-cycles, similar to jQuery's AJAX-methods.
- Communicates with underlying webservices using a consistent REST with JSON-format.
- Intentionally has no domain knowledge whatsoever.
- Passes every call on as events, to the [Events-service](https://github.com/bitnissen/NodeJS-EventService/tree/master).

## Getting started

Either compile and run with Docker, or just run straight off using NodeJS. Supports `.env` as well as regular environment variables, of which the latter has precedence.

By default this NodeJS server binds to port `80`.

It is required to provide the following environment variables:

-  `SYSEVENT`: tells the API Gateway where the Event-service the IP/hostname and port of the Event-service.

You may optionally also apply:

- `WEB_PORT`: Defaults to port `80` (ie. regular HTTP-port).
- `WEB_IP`: Defaults to `0.0.0.0` (ie. available on all interfaces).

### Docker approach (recommended)

Start by compiling into an image - we prefix the system-parts, ie. non domain related services, with `sys`, but do as suits you best:

```bash
docker build -t sys-apigateway .
```

To run you would simply do:

```shell
docker run -p 8080:80 -d -e SYSEVENT="http://my-event-server" sys-apigateway
```

Which would run the service and expose it on port 8080 on your machine.

### Vanilla NodeJS

The service is tested and known to work with NodeJS v8.11.1. It should work with any version above 8.4.

To get started, install the dependencies:

```shell
npm install
```

Then to run the service:

```bash
SYSEVENT="http://my-event-server" npm run dev
```

Which will run the webservice on port 80, bound to all interfaces.

## Documentation

### Notice: All API-calls are automatically prefixed!

As a convention, all Event Service listeners prefix their own name to all events they are intended to handle.

The same is true for the API Gateway, which uses the prefix `www.` to indicate that a request came from, potentially, anyone on the whole wide web.

This means that when you request `"api": "my-service/abc/123"`, you are in fact triggering the event `www.my-service/abc/123`.

This also means that, if the underlying services are properly secured from the internet, then they can safely communicate with each other using other prefixes, while listening to outside requests by hooking into the `www.` prefix.

### Communication via REST

Simply do HTTP POST's to `/call-api` with the request body JSON-encoded. You also need to specify the header `Content-Type: application/json`.

The structure of a request, is:

```javascript
{
    "api": "my-service",
    "payload": { "abc": "def" }
}
```

This would trigger the event `www.my-service` to be triggered on the Event Service.

The general structure of a successful response, is an array of responses from the listening end-points.

```javascript
[
  {
    "response": [ 1, 2, 3, { "name": "John Doe" } ],
    "status": 200,
    "service": "my-normal-service"
  },
  {
    "response": { "message": "Missing Authentication Token" },
    "status": 403,
    "service": "my-service-with-auth"
  }
]
```

When communicating via REST, this is returned in JSON. When using our Javascript-client, it is returned as a Javascript-array, as seen above (ie. no JSON decoding necessary).

If there are no listeners, an empty array will simply be returned, ie.

```javascript
[]
```

### Communication from external API's

In case you would like external API's to call events directly, it is also possible to use the alternative syntax:

* Method: GET/POST
* URL: `/external/{api-name}`

This way any data passed on as either query arguments (GET) or in the body (POST) is passed on and doesn't require any particular syntax from the sender side, making it compatible with most webhooks etc.

Normally all event replies are returned in an array, but you might need to return a different syntax when talking with external APIs. For this purpose, you may use the following URL instead, which only returns the response of the first listener:

* URL: `/external-single/{api-name}`

**Note 1:** As there is no guaranteed order of the listeners, we recommend that you only have one listener attached to the endpoints triggered in the `external-single`-endpoint.

**Note 2:** When using `external-single`, all listeners are still called, but only the response of one of the listeners are returned (underlining the point of note 1 above).


#### GET-requests

As a GET-request has no body, any additional query parameters are unpacked into a key-value object, ie. `?a=1&b[]=2&b[]=3&c[name]=test` which would be parsed into the following object and passed on as `payload`:

```javascript
{
  "a": "1",
  "b": [
    "2", "3"
  ],
  "c": {
    "name": "test"
  }
}
```

#### POST-requests

For POST-requests, the entire body is passed on as a Javascript-object/array in the `payload`-property, if the content is JSON.

Otherwise the entire body is passed on  in the `payload`-property as a JSON-encoded string, enclosed in an object, with the property `raw`. For example, if you posted `abc"def`, then the Event Service would receive this object in the payload:

```javascript
{
  "raw": "abc\"def"
}
```


### Using the Javascript-client

**We clearly recommend this approach in web-applications for maximum performance!**

Socket.io negotiates the best possible protocol, depending on the clients browser capabilities and network configuration. It initiates by immediately creating a Long Polling-connection and, in parallel, tries to create a websocket-connection, which it then switches to transparently. In both cases (especially if websockets is supported) this really gives a performance boost for all webservice requests.

#### Installing

Install the following scripts in your website.

```html
<script src="http://my-api-gateway/socket.io/socket.io.js"></script>
<script src="http://my-api-gateway/client.js"></script>
```

Furthermore, before doing your first API call, you will need to connect to the API, which you do by:

```javascript
agw.init('http://my-api-gateway');
```

This method doesn't return anything, but initiates the connection. If you call it multiple times, all sub-sequent calls are silently ignored.

You will immediately be able to call the API. Any calls you initiate before the underlying connection has been established, will simply queue up and execute automatically once a connection is established.

#### Doing requests

To call the service using the Javascript-client, call `agw` with the arguments in the following order:

- Path: The path of the underlying service, for instance `my-service/sub-endpoint`.
- Payload: Plain Javascript-object.

The call returns a Promise. When a Promise is **resolved**, the argument contains the body - or null, if empty but succesful request.

For example, for a request with a payload, to the event `www.my-service` would look like:

```javascript
agw('my-service', {some_data: 12345, more_data: [1, 'abc', 3]}).then(
    response => console.log('Success! Response from server: ', response)
);
```

Or for a request with no payload, you could simply call:

```javascript
agw('my-service').then(
    response => console.log('Success! Response from server: ', response)
);
```

Be aware that there is no guarantee to the order of handling and response of the requests. Ie. the last request sent, might finish before earlier requests.