var http = require('http');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser'); // PARA FAZER O PARSE DE CHAMADAS POST RECEBIDAS EM Application/Json
var servidor = express();
var colors = require('colors');
var session = require('client-sessions');
var cors = require('cors');
var mailer = require('nodemailer');
var transporter = mailer.createTransport('smtps://atendimento%40peker.com.br:PEKER@321@smtp.zoho.com');
servidor.use(bodyParser.json());
servidor.use(express.static('public')); // PASTA PARA RESOURCES
servidor.use(cors());
servidor.set('views', 'views');
servidor.engine('html', require('ejs').renderFile);

const dfAPIKey = "8a89ec5da25d606fdae60af216ca4563d502ff9010014f593f8acd7554aa94df";
const localDfAPIKey = "d7475874c5665a4cd44be1cba95b715945a0406c7006ec2b1b797f191ce7528e";

const header = {  'Accept' : 'application/json', 
                'X-DreamFactory-Api-Key' : dfAPIKey
              };
const sendJsonHeader = {  //'Accept' : 'application/json', 
                'X-DreamFactory-Api-Key' : dfAPIKey,
                'Content-type' : 'Application/json'
              };
			  
const dreamFac = {
    path: '/api/v2/biocare/_table',
    port: 8080,
    host: 'localhost'
};

servidor.use(session({
  cookieName: 'session',
  secret: 'eIdaj@*&iosj9J0su8AA!#!$%0adaduADUajD',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly: true,
  secure: true,
  ephemeral: true
}));

servidor.use(function (req, res, next) {
    aviso('avisoReq', req, { code: 0 });
    res.removeHeader("x-powered-by");
    next();
});

servidor.get('/teste', function (req, res) {
    res.send("Bio Care by InoveItSolutions.");
});

servidor.get('/email', function(req, res){

    if(req.params.receiver){
        var email = {
            receiverName: req.params.receiver,
            receiverEmail: req.params.receiver,
            htmlBody: '<h3> Olá, este é um email de teste!</h3>'+
                        '<p> Testando o serviço de email </p>'
        }

        sendMail(email, function(sent){
            if(sent){
                res.send('Email enviado com sucesso!');
            }else{
                res.send('Houve um erro no envio do email, verifique se você inseriu o email corretamente no parâmetro "receiver"');
            }
        });
    }else{
        res.send('Parâmetro "receiver" não enviado.');
    }
    
});

function sendMail(email, callback){
    var mailOptions = {
        from: '"Marco" <atendimento@peker.com.br>', // sender address 
        to: email.receiverName+', '+email.receiverEmail, // list of receivers 
        subject: email.subject, // Subject line 
        //text: 'Hello world 🐴', // plaintext body 
        html: email.htmlBody // html body 
    };
    
    // send mail with defined transport object 
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            callback(false);
            console.log(error);
        }
        console.log('Message sent: ' + info.response);
        callback(true);
    });
}

function userOk(email, password, callback) {
    console.log("EMAILLL " + email + "  PASSSSWORD : " + password);
    
    var options = {
        host:  dreamFac.host,
        port:  dreamFac.port,
        //path: "/api/v2/estafacilsql/_table/users?filter=(name='" + user + "') AND (password='" + password + "')",
        path: dreamFac.path+"/usuarios?filter=(email%3D'"+email+"')%20AND%20(password%3D'"+password+"')&related=motoboys_by_motoboyid,empresas_by_empresaid,clientes_by_clienteid",
        method : 'GET',
        headers : header
    };
    
    //console.log("path request " + options.path);
    //console.log("header request "+options.headers);
    
    http.get(options, function(resp) {
        
        //console.log('RESPONSE STATUS: ' + resp.statusCode);
        //console.log('RESPONSE HEADERS: ' + JSON.stringify(resp.headers));
        
        resp.on('data', (chunk) => {
            if(JSON.parse(chunk).error){
                console.log(JSON.parse(chunk));
                callback(false);
            } else if (JSON.stringify(JSON.parse(chunk)).length > 15) {
                console.log(JSON.parse(chunk));
                callback(true, JSON.parse(chunk).resource[0]);
            } else {
                callback(false);
            }
        });
        
        resp.on('end', () => {
            console.log('No more data in response.');
        });
    
    });
    
    
    
}

function get(table, queries, callback) {

    var options = {
        host: dreamFac.host,
        port: dreamFac.port,
        path: dreamFac.path + '/' + table + (queries? queries : ''),
        method : 'GET',
        headers : header
    };

    http.get(options, function (resp) {
        var data = "";
        resp.on('data', (chunk) => {
            data += chunk
        });
        resp.on('end', () => {
            if (JSON.parse(data).error) {
                console.log(data);
                callback(null);
            } else {
                var result = JSON.parse(data);
                callback(result.resource ? result.resource : result);
                //METADADOS COMO 'COUNT' ficam em : RESOURCE.META.COUNT
            }
        });
    });

}

function post(table, queries, postData, callback) {
    
    var options = {
        host: dreamFac.host,
        port: dreamFac.port,
        path: dreamFac.path + '/' + table + (queries? queries : ''),        
        method : 'POST',
        headers : header
    };

    var request = http.request(options, function (resp) {
        
        var data = "";

        resp.on('data', (chunk) => {
            data += (chunk);
        });
        
        resp.on('end', () => {
            if (JSON.parse(data).error) {
                callback(null);
            } else {
                callback(data);
            }
        });
           
    });
    request.write(JSON.stringify(postData));
    request.end();

}

function put(table, queries, putData, callback) {

    var options = {
        host: dreamFac.host,
        port: dreamFac.port,
        path: dreamFac.path + '/' + table + (queries? queries : ''),        
        method : 'PUT',
        headers : header
    };

    var request = http.request(options, function(resp) {
        
        var data = "";

        resp.on('data', (chunk) => {
            data += (chunk);
        });
        
        resp.on('end', () => {
            if (JSON.parse(data).error) {
                console.log(data);
                callback(null);
            } else {
                callback(JSON.parse(data));
            }
        });
           
    });
    request.write(JSON.stringify(putData));
    request.end();

}

function del(table, queries, delData, callback) {
    
    var options = {
        host: dreamFac.host,
        port: dreamFac.port,
        path: dreamFac.path + '/' + table + (queries? queries : ''),        
        method : 'DELETE',
        headers : header
    };

    var request = http.request(options, function(resp) {
        
        var data = "";
        
        resp.on('data', (chunk) => {
            data += (chunk);
        });
        
        resp.on('end', () => {
            if (JSON.parse(data).error) {
                callback(null);
            } else {
                callback(data);
            }
        });
           
    });

    request.write(delData);
    request.end();

}

var aviso = function (tipo, req, status) {
    switch (tipo) {
        case "avisoReq":
            console.log("[INFO]".yellow);
            console.log(("[DATA/HORA : "+ new Date()+"]").green);
            console.log(("Novo Request do IP : " + req.ip).green);
            console.log(((req.session.user != undefined) ? "Possui seção ? SIM -> USUÁRIO : "+req.session.user : "Possui seção ? NÃO").cyan);
            console.log(("Para o Servico : " + req.originalUrl).cyan);
            console.log(("Utilizando o método: " + req.method).cyan);
            console.log(("Com o[s] Parâmetro[s] : " + JSON.stringify(req.params)).cyan);
            console.log(("Com a[s] Query[ies] : " + JSON.stringify(req.query)).cyan);
            console.log(("Com o body : " + JSON.stringify(req.body)).cyan);
            //console.log(("Com os headers: "+JSON.stringify(req.headers)).cyan);
            console.log(("Com o tamanho: "+req.headers['content-length']).cyan);
            console.log((status.code == 0)? ("REQUISIÇÃO PASSOU (Motivo : Path está na lista de exceções)").yellow : (status.code == 1)? ("REQUISIÇÃO PASSOU (Motivo : Usuário possui sessão válida)").green : ("REQUISIÇÃO BLOQUEADA E REDIRECIONA (Para : /login) (Motivo : Usuário não possui seção válida) ").red);
            console.log("---------------------------------------------------------------\n".yellow);
            break;
        default:
            break;
    }
};

servidor.listen(80, function () {
  console.log('BioCare WebServer listening on port 3000!');
});