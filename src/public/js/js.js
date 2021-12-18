function sendPostRequest(endpoint, body, callback, contentType='application/json') {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", endpoint, true);
  if (contentType) xhr.setRequestHeader('Content-Type', contentType);
  xhr.onreadystatechange = function() {
    if(xhr.readyState === XMLHttpRequest.DONE) {
      var status = xhr.status;
      if (status===0||(status>=200&&status<400)) {
        callback(xhr.response);
      } else {
        console.log(xhr.statusText);
        callback(null);
      }
    }
  };
  xhr.send(body);
}

function ready(callback){
  if (document.readyState!='loading') callback();
  else if (document.addEventListener) document.addEventListener('DOMContentLoaded', callback)
  else document.attachEvent('onreadystatechange', function(){ if(document.readyState=='complete') callback();});
}
