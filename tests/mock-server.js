var http = require("http");
var express = require("express");

function MockServer(test) {
    this.test = test;
    this.headers = {};
}

module.exports = MockServer;

MockServer.prototype.usePort = function (port) {
    this.port = port;
};

MockServer.prototype.expectUser = function(user) {
    this.user = user;
};

MockServer.prototype.expectPass = function (pass) {
    this.pass = pass;
};

MockServer.prototype.expectMethod = function (method) {
    this.method = method;
};

MockServer.prototype.expectPath = function(path) {
    this.path = path;
};

MockServer.prototype.expectProperties = function (properties) {
    this.properties = properties;
};

MockServer.prototype.expectFile = function (fileName) {
    this.fileName = fileName;
};

MockServer.prototype.listen = function(callback) {
    var self = this;

    var app = express();

    app.use(express.basicAuth(function (user, pass) {
        self.test.equal(user, self.user, "Wrong user name");
        self.test.equal(pass, self.pass, "Wrong password");
        return true;
    }));

    app.use(express.bodyParser());

    app.get("*", function (req, res, next) {
        if (self.method) {
            self.test.equal(self.method, "get", "Wrong HTTP method, expected GET");
        }

        next();
    });

    app.post("*", function (req, res, next) {
        if (self.method) {
            self.test.equal(self.method, "post", "Wrong HTTP method, expected POST");
        }

        next();
    });

    app.all("*", function (req, res) {
        if (self.path) {
            self.test.equal(req.path, self.path, "Wrong request path");
        }

        if (self.fileName) {
            self.test.ok(req.files[self.fileName] !== undefined, "Expected file not found");
        }

        if (self.properties) {
            Object.keys(self.properties).forEach(function (name) {
                var bv = req.body[name], pv = self.properties[name];
                self.test.ok(bv !== undefined, "Parameter not found");
                self.test.equal(bv.toString(), pv.toString(), "Parameter doesn't have the expected value");
            });
        }

        res.send(200);
    });

    var server = http.createServer(app);

    server.on("listening", function () {
        callback(function () {
            server.close();
        });
    });

    server.on("close", function () {
        self.test.done();
    });

    server.listen(self.port);
};