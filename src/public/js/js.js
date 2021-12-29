function sendPostRequest(endpoint, body, callback, contentType='application/json') {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", endpoint, true);
  if(contentType) xhr.setRequestHeader('Content-Type', contentType);
  xhr.onreadystatechange = function() {
    if(xhr.readyState===XMLHttpRequest.DONE) {
      var status = xhr.status;
      if (status===0||(status>=200&&status<400)) {
        callback(xhr.response);
      } else {
        console.log('DEBUG: '+status+' '+xhr.statusText);
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

function nhsFieldCheck() {
  document.getElementById('nhs').oninput=(event)=>{
    event.target.classList.remove('is-danger');
    document.getElementById('nhs-next').disabled=true;
    for(let element of document.getElementsByClassName('nhs-warning')) element.style.display = 'none';
    let nonDigits = !event.target.value.match(/^\d*(\.\d+)?$/) 
    let tooLong = event.target.value.length>10;
    if(nonDigits||tooLong) {
      event.target.classList.add('is-danger');
      for(let element of document.getElementsByClassName('nhs-warning')) element.style.removeProperty('display');
    }
    if(!nonDigits&&event.target.value.length==10) document.getElementById('nhs-next').disabled=false;
  }
}

function nhsClick() {
  document.getElementById('nhs-next').onclick=()=>{
    let nhs = document.getElementById('nhs-input').value;
    sendPostRequest('/device/setIdCookie', '{"patientId":"'+nhs+'"}', (response)=>{if(response) console.log('DEBUG: '+response)});
    document.getElementById('nhs').style.display='none';
    document.getElementById('connect').style.removeProperty('display');
  }
}
