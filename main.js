'use strict';
const http = require('http');

const port = 9999;
const statusNotFound = 404;
const statusBadRequest = 400;
const statusOk = 200;
const posts = [];
let nextId = 1;

function sendResponse(response,{status = statusOk,headers = {},body = null}){
    Object.entries(headers).forEach(function([key,value]){
        response.setHeader(key,value);
    });
    response.writeHead(status);
    response.end(body);
    return;
}

function sendJson(response,body){
    sendResponse(response,{
        headers: {
            'Content-Type':'application/json',
        },
        body: JSON.stringify(body),
    });
}

const methods = new Map;
methods.set('/posts.get',function({response}){
    sendJson(response,posts);
});
methods.set('/posts.getById',function({request,response}){});
methods.set('/posts.post',function({response,searchParams}){
    
    if (!searchParams.has('content')){
        response.writeHead(statusBadRequest);
        response.end();
        return;
    }

    const content = searchParams.get('content');

    const post = {
        id : nextId++,
        content: content,
        created: Date.now(),
    };

    posts.unshift(post);
    sendJson(response,post);
});
methods.set('/posts.edit',function(request,response){});
methods.set('/posts.edelete',function(request,response){});

const server = http.createServer(function(request,response){
    const {pathname,searchParams} = new URL(request.url,`http://${request.headers.host}`);

    const method = methods.get(pathname);

    if (method === undefined){
        sendResponse(response,{status: statusNotFound,headers: {},body:'page not found'});
        return;
    }

    const params = {
        request,
        response,
        pathname,
        searchParams,
    };
    
    method(params);
});


server.listen(port);
