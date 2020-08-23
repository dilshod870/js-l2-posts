'use strict';
const http = require('http');

const port = 9999;
const statusNotFound = 404;
const statusBadRequest = 400;
const statusOk = 200;
const posts = [];
let nextId = 1;

function sendResponse(response,{status = statusOk,headers = {},body = null}){
    //console.log('status-' + status);
    Object.entries(headers).forEach(function([key,value]){
        response.setHeader(key,value);
    });
    response.writeHead(status);
    response.end(body);
    return;
}

function sendJson(response,body){
    sendResponse(response,{
        status: statusOk,
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
methods.set('/posts.getById',function({response,searchParams}){
    
    const content = Number(searchParams.get('id'));

    if (Number.isNaN(content)){
        sendResponse(response,{
            status: statusBadRequest,
            body:'bad request',
        });
        return;
    }

    const post = posts.find(item => item.id === content);
    if (post === undefined){
        sendResponse(response,{
            status: statusNotFound,
            body:'page not found'
        });
        return;
    }

    sendJson(response,post);
});
methods.set('/posts.post',function({response,searchParams}){
    
    if (!searchParams.has('content')){
        sendResponse(response,{status: statusBadRequest});
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
methods.set('/posts.edit',function({response,searchParams}){
    if (!searchParams.has('id') || !searchParams.has('content')){
        sendResponse(response,{
            status: statusBadRequest,
            body:'bad request',
        });
        return;
    }

    const id = Number(searchParams.get('id'));
    const content = searchParams.get('content');
    
    if (Number.isNaN(id) || !content.trim()){
        sendResponse(response,{
            status: statusBadRequest,
            body:'bad request',
        });
        return;
    }

    const postId = posts.findIndex(item => item.id === id);
    
    if (postId === -1){
        sendResponse(response,{
            status: statusNotFound,
            body:'page not found'
        });
        return;
    }

    posts[postId].content = content;
    const post = posts[postId];
    sendJson(response,post);
});
methods.set('/posts.delete',function(){

});

const server = http.createServer(function(request,response){
    const {pathname,searchParams} = new URL(request.url,`http://${request.headers.host}`);

    const method = methods.get(pathname);

    if (method === undefined){
        sendResponse(response,{status: statusNotFound,body:'page not found'});
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
