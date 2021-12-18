class FunctionEvent {
  
  constructor(req) {
    this.body = req.body;
    this.headers = req.headers;
    this.method = req.method;
    this.query = req.query;
    this.path = req.path;
  }

}

module.exports = FunctionEvent
