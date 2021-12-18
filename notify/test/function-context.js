class FunctionContext {

  constructor(cb) {
    this.value = 200;
    this.cb = cb;
    this.headerValues = {};
    this.cbCalled = 0;
  }
  
  status(value) {
    if(!value) {
      return this.value;
    }
    this.value = value;
    return this;
  }
  
  headers(value) {
    if(!value) {
      return this.headerValues;
    }
    this.headerValues = value;
    return this;    
  }
  
  succeed(value) {
    let err;
    this.cbCalled++;
    this.cb(err, value);
  }
  
  fail(value) {
    let message;
    this.cbCalled++;
    this.cb(value, message);
  }
  
}

module.exports = FunctionContext
